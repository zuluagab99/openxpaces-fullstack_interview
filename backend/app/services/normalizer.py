"""
Normalization service.
All functions are pure (no DB, no side effects) — easy to unit test.
"""
import re
import hashlib
from datetime import date
from typing import Optional
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Output types
# ---------------------------------------------------------------------------

@dataclass
class NormalizedDeal:
    tenant_name: str
    street: str
    city: str
    state: str
    zip: Optional[str]
    size_sqft: int
    rent_psf: float
    lease_type: str
    lease_start_date: date
    lease_term_months: Optional[int]
    data_source: Optional[str]
    dedup_hash: str
    raw_input: dict


@dataclass
class NormalizationError:
    index: int
    field: str
    raw: str
    reason: str


@dataclass
class NormalizationResult:
    deal: Optional[NormalizedDeal] = None
    errors: list[NormalizationError] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return len(self.errors) == 0


# ---------------------------------------------------------------------------
# size_sqft
# ---------------------------------------------------------------------------

def normalize_size(raw) -> int:
    if raw is None:
        raise ValueError("size is required")
    cleaned = str(raw).lower()
    cleaned = re.sub(r"[,\s]", "", cleaned)   # remove commas and spaces
    cleaned = re.sub(r"sf?$", "", cleaned)     # strip trailing "sf" or "s"
    try:
        return int(float(cleaned))
    except (ValueError, TypeError):
        raise ValueError(f"unparseable size value: {raw!r}")


# ---------------------------------------------------------------------------
# rent_psf
# ---------------------------------------------------------------------------

def normalize_rent(raw, size_sqft: int) -> float:
    if raw is None:
        raise ValueError("rent is required")

    cleaned = str(raw).strip().lower()

    # reject clearly non-numeric strings
    if re.match(r"^[a-z\s]+$", cleaned):
        raise ValueError(f"unparseable rent value: {raw!r}")

    # strip currency symbol and spaces
    cleaned = cleaned.replace("$", "").replace(" ", "")

    # monthly rent  e.g. "45000/mo" or "37500/mo"
    monthly_match = re.match(r"^([\d.]+)/mo$", cleaned)
    if monthly_match:
        monthly = float(monthly_match.group(1))
        if size_sqft <= 0:
            raise ValueError("cannot convert monthly rent: size_sqft is zero")
        return round((monthly * 12) / size_sqft, 2)

    # per-SF formats: "34/sf", "34", "42.50/sf"
    per_sf = re.sub(r"/sf?$", "", cleaned)
    try:
        return round(float(per_sf), 2)
    except ValueError:
        raise ValueError(f"unparseable rent value: {raw!r}")


# ---------------------------------------------------------------------------
# lease_type
# ---------------------------------------------------------------------------

_LEASE_MAP = {
    "nnn": "NNN",
    "triple net": "NNN",
    "triple-net": "NNN",
    "gross": "GROSS",
    "full service": "GROSS",
    "fs": "GROSS",
    "gross lease": "GROSS",
    "modified": "MODIFIED",
    "modified gross": "MODIFIED",
    "mod gross": "MODIFIED",
    "mg": "MODIFIED",
}


def normalize_lease_type(raw) -> str:
    if not raw:
        return "UNKNOWN"
    return _LEASE_MAP.get(str(raw).strip().lower(), "UNKNOWN")


# ---------------------------------------------------------------------------
# address
# ---------------------------------------------------------------------------

@dataclass
class ParsedAddress:
    street: str
    city: str
    state: str
    zip: Optional[str]


def normalize_address(raw: str) -> ParsedAddress:
    if not raw or not raw.strip():
        raise ValueError("address is required")

    raw = raw.strip()

    # Pattern 1: "123 Main St, Austin, TX 78701" (two commas, standard)
    standard = re.match(
        r"^(.+),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$",
        raw,
        re.IGNORECASE,
    )
    if standard:
        return ParsedAddress(
            street=standard.group(1).strip(),
            city=standard.group(2).strip(),
            state=standard.group(3).upper(),
            zip=standard.group(4) or None,
        )

    # Pattern 2: "742 King Rd, San Jose CA 95112" (one comma, city+state together)
    one_comma = re.match(
        r"^(.+),\s*(.+?)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$",
        raw,
        re.IGNORECASE,
    )
    if one_comma:
        return ParsedAddress(
            street=one_comma.group(1).strip(),
            city=one_comma.group(2).strip(),
            state=one_comma.group(3).upper(),
            zip=one_comma.group(4) or None,
        )

    # Pattern 3: "455 Brickell Ave Miami FL" (no commas, heuristic)
    tokens = raw.split()
    if len(tokens) >= 3 and re.match(r"^[A-Z]{2}$", tokens[-1], re.IGNORECASE):
        state = tokens[-1].upper()
        city = tokens[-2]
        street = " ".join(tokens[:-2])
        return ParsedAddress(street=street, city=city, state=state, zip=None)

    raise ValueError(f"unparseable address: {raw!r}")


# ---------------------------------------------------------------------------
# dedup hash
# ---------------------------------------------------------------------------

def make_dedup_hash(tenant_name: str, street: str, start_date: date) -> str:
    key = f"{tenant_name.lower().strip()}|{street.lower().strip()}|{start_date.isoformat()}"
    return hashlib.sha256(key.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def normalize_record(raw: dict, index: int) -> NormalizationResult:
    errors: list[NormalizationError] = []

    def err(field: str, raw_val, reason: str):
        errors.append(NormalizationError(index=index, field=field, raw=str(raw_val), reason=reason))

    # --- address (needed for dedup hash) ---
    try:
        address = normalize_address(raw.get("address", ""))
    except ValueError as e:
        err("address", raw.get("address", ""), str(e))
        address = None

    # --- size (needed before rent for monthly conversion) ---
    try:
        size_sqft = normalize_size(raw.get("size"))
    except ValueError as e:
        err("size", raw.get("size"), str(e))
        size_sqft = None

    # --- rent ---
    try:
        rent_psf = normalize_rent(raw.get("rent"), size_sqft or 0)
    except ValueError as e:
        err("rent", raw.get("rent"), str(e))
        rent_psf = None

    # --- start date ---
    try:
        lease_start_date = date.fromisoformat(str(raw.get("start_date", "")))
    except (ValueError, TypeError):
        err("start_date", raw.get("start_date"), "invalid or missing date (expected YYYY-MM-DD)")
        lease_start_date = None

    # --- term months (optional, coerce string → int) ---
    lease_term_months = None
    raw_term = raw.get("term_months")
    if raw_term is not None:
        try:
            lease_term_months = int(raw_term)
        except (ValueError, TypeError):
            err("term_months", raw_term, "expected an integer number of months")

    if errors:
        return NormalizationResult(errors=errors)

    tenant_name = str(raw.get("tenant", "")).strip()
    dedup_hash = make_dedup_hash(tenant_name, address.street, lease_start_date)

    return NormalizationResult(
        deal=NormalizedDeal(
            tenant_name=tenant_name,
            street=address.street,
            city=address.city,
            state=address.state,
            zip=address.zip,
            size_sqft=size_sqft,
            rent_psf=rent_psf,
            lease_type=normalize_lease_type(raw.get("lease_type")),
            lease_start_date=lease_start_date,
            lease_term_months=lease_term_months,
            data_source=raw.get("source"),
            dedup_hash=dedup_hash,
            raw_input=raw,
        )
    )
