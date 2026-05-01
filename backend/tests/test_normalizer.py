"""
Unit tests for normalizer.py.
Run with: python -m pytest tests/ -v
"""
import pytest
from app.services.normalizer import (
    normalize_size,
    normalize_rent,
    normalize_lease_type,
    normalize_address,
    normalize_record,
)


# ---------------------------------------------------------------------------
# size
# ---------------------------------------------------------------------------

class TestNormalizeSize:
    def test_string_with_commas(self):
        assert normalize_size("10,000") == 10000

    def test_plain_int(self):
        assert normalize_size(10000) == 10000

    def test_string_with_sf_suffix(self):
        assert normalize_size("15,500 sf") == 15500

    def test_string_with_SF_suffix(self):
        assert normalize_size("12,000 SF") == 12000

    def test_plain_string_number(self):
        assert normalize_size("9000") == 9000

    def test_invalid_raises(self):
        with pytest.raises(ValueError):
            normalize_size("not a number")

    def test_none_raises(self):
        with pytest.raises(ValueError):
            normalize_size(None)


# ---------------------------------------------------------------------------
# rent
# ---------------------------------------------------------------------------

class TestNormalizeRent:
    def test_plain_number(self):
        assert normalize_rent("34", 10000) == 34.00

    def test_dollar_per_sf(self):
        assert normalize_rent("$34/SF", 10000) == 34.00

    def test_dollar_with_spaces(self):
        assert normalize_rent("$22 / sf", 4800) == 22.00

    def test_decimal(self):
        assert normalize_rent("$42.50/SF", 20000) == 42.50

    def test_monthly_rent(self):
        # 45000/mo @ 8500 sqft = (45000 * 12) / 8500 = 63.53
        assert normalize_rent("45000/mo", 8500) == 63.53

    def test_monthly_with_spaces(self):
        # 37500/mo @ 7500 sqft = 60.00
        assert normalize_rent("37500 / mo", 7500) == 60.00

    def test_not_provided_raises(self):
        with pytest.raises(ValueError):
            normalize_rent("not provided", 5000)

    def test_none_raises(self):
        with pytest.raises(ValueError):
            normalize_rent(None, 5000)


# ---------------------------------------------------------------------------
# lease_type
# ---------------------------------------------------------------------------

class TestNormalizeLeaseType:
    def test_nnn_lowercase(self):
        assert normalize_lease_type("nnn") == "NNN"

    def test_triple_net(self):
        assert normalize_lease_type("triple net") == "NNN"

    def test_gross_uppercase(self):
        assert normalize_lease_type("GROSS") == "GROSS"

    def test_gross_lease(self):
        assert normalize_lease_type("Gross Lease") == "GROSS"

    def test_modified_gross(self):
        assert normalize_lease_type("Modified Gross") == "MODIFIED"

    def test_mod_gross(self):
        assert normalize_lease_type("mod gross") == "MODIFIED"

    def test_unknown_fallback(self):
        assert normalize_lease_type("something weird") == "UNKNOWN"

    def test_empty_string(self):
        assert normalize_lease_type("") == "UNKNOWN"


# ---------------------------------------------------------------------------
# address
# ---------------------------------------------------------------------------

class TestNormalizeAddress:
    def test_standard_with_zip(self):
        a = normalize_address("1200 NW 7th Ave, Miami, FL 33136")
        assert a.street == "1200 NW 7th Ave"
        assert a.city == "Miami"
        assert a.state == "FL"
        assert a.zip == "33136"

    def test_standard_without_zip(self):
        a = normalize_address("88 Market St, Austin, TX")
        assert a.city == "Austin"
        assert a.state == "TX"
        assert a.zip is None

    def test_no_commas_heuristic(self):
        a = normalize_address("455 Brickell Ave Miami FL")
        assert a.city == "Miami"
        assert a.state == "FL"
        assert a.zip is None

    def test_empty_raises(self):
        with pytest.raises(ValueError):
            normalize_address("")

    def test_none_raises(self):
        with pytest.raises(ValueError):
            normalize_address(None)


# ---------------------------------------------------------------------------
# full record normalization
# ---------------------------------------------------------------------------

class TestNormalizeRecord:
    def _base(self, **overrides):
        record = {
            "tenant": "Acme Logistics",
            "address": "1200 NW 7th Ave, Miami, FL 33136",
            "size": "10,000",
            "rent": "$34/SF",
            "lease_type": "triple net",
            "start_date": "2024-02-01",
            "term_months": 60,
            "source": "broker-email",
        }
        record.update(overrides)
        return record

    def test_clean_record_imports(self):
        result = normalize_record(self._base(), index=0)
        assert result.ok
        assert result.deal.size_sqft == 10000
        assert result.deal.rent_psf == 34.00
        assert result.deal.lease_type == "NNN"

    def test_missing_rent_is_error(self):
        result = normalize_record(self._base(rent="not provided"), index=8)
        assert not result.ok
        assert any(e.field == "rent" for e in result.errors)

    def test_empty_address_is_error(self):
        result = normalize_record(self._base(address=""), index=14)
        assert not result.ok
        assert any(e.field == "address" for e in result.errors)

    def test_term_months_as_string_coerces(self):
        result = normalize_record(self._base(term_months="60"), index=0)
        assert result.ok
        assert result.deal.lease_term_months == 60

    def test_monthly_rent_conversion(self):
        result = normalize_record(self._base(rent="45000/mo", size="8500"), index=2)
        assert result.ok
        assert result.deal.rent_psf == 63.53
