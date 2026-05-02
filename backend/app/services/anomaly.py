"""
Rule-based anomaly detection for deal records.
Returns a list of flag strings — stored as JSON on the deal row.
"""
from app.services.normalizer import NormalizedDeal

# Thresholds based on typical US commercial real estate ranges
RENT_HIGH      = 150.0   # $/SF — outlier for most markets
RENT_LOW       = 5.0     # $/SF — suspiciously cheap
SQFT_LARGE     = 50_000  # SF   — very large single lease
TERM_LONG      = 120     # months (10 years+)
TERM_SHORT     = 12      # months (less than 1 year)


def detect_anomalies(deal: NormalizedDeal) -> list[str]:
    flags: list[str] = []

    if deal.rent_psf > RENT_HIGH:
        flags.append("high_rent")
    if deal.rent_psf < RENT_LOW:
        flags.append("low_rent")
    if deal.size_sqft > SQFT_LARGE:
        flags.append("large_space")
    if deal.lease_term_months:
        if deal.lease_term_months > TERM_LONG:
            flags.append("long_term")
        if deal.lease_term_months < TERM_SHORT:
            flags.append("short_term")

    return flags