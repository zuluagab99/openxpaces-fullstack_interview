"""
Unit tests for anomaly detection — pure function, no DB.
"""
from datetime import date
from app.services.normalizer import NormalizedDeal
from app.services.anomaly import detect_anomalies


def make_deal(**overrides):
    base = dict(
        tenant_name="Test Co", street="123 Main", city="Austin", state="TX",
        zip=None, size_sqft=5000, rent_psf=35.0, lease_type="NNN",
        lease_start_date=date(2024, 1, 1), lease_term_months=60,
        data_source="test", dedup_hash="abc", raw_input={},
    )
    base.update(overrides)
    return NormalizedDeal(**base)


def test_no_flags_on_normal_deal():
    assert detect_anomalies(make_deal()) == []

def test_high_rent_flag():
    flags = detect_anomalies(make_deal(rent_psf=200.0))
    assert "high_rent" in flags

def test_low_rent_flag():
    flags = detect_anomalies(make_deal(rent_psf=3.0))
    assert "low_rent" in flags

def test_large_space_flag():
    flags = detect_anomalies(make_deal(size_sqft=60_000))
    assert "large_space" in flags

def test_long_term_flag():
    flags = detect_anomalies(make_deal(lease_term_months=240))
    assert "long_term" in flags

def test_short_term_flag():
    flags = detect_anomalies(make_deal(lease_term_months=6))
    assert "short_term" in flags

def test_multiple_flags():
    flags = detect_anomalies(make_deal(rent_psf=200.0, size_sqft=60_000))
    assert "high_rent" in flags
    assert "large_space" in flags