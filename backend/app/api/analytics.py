from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.db import get_db
from app.models.models import Deal, Property, LeaseType
from app.schemas.schemas import MarketSummaryResponse
from app.services.cache import cache_get, cache_set
from app.middleware.auth import require_api_key

router = APIRouter(prefix="/analytics", tags=["analytics"], dependencies=[Depends(require_api_key)])


@router.get("/market-summary", response_model=MarketSummaryResponse)
def market_summary(
    city:     str = Query(...),
    state:    str = Query(...),
    sqft_min: Optional[int] = None,
    sqft_max: Optional[int] = None,
    db: Session = Depends(get_db),
):
    cache_key = f"market:{city.lower()}:{state.lower()}:{sqft_min}:{sqft_max}"
    cached = cache_get(cache_key)
    if cached:
        return MarketSummaryResponse(**{**cached, "cached": True})

    q = (
        db.query(Deal)
        .join(Deal.property)
        .filter(
            func.lower(Property.city)  == city.lower(),
            func.lower(Property.state) == state.lower(),
        )
    )
    if sqft_min is not None: q = q.filter(Deal.size_sqft >= sqft_min)
    if sqft_max is not None: q = q.filter(Deal.size_sqft <= sqft_max)

    deals = q.all()
    if not deals:
        raise HTTPException(status_code=404, detail=f"No deals found for {city}, {state}")

    rents  = sorted([float(d.rent_psf) for d in deals])
    count  = len(rents)
    avg    = round(sum(rents) / count, 2)
    mid    = count // 2
    median = round(rents[mid] if count % 2 != 0 else (rents[mid - 1] + rents[mid]) / 2, 2)

    breakdown = {lt.value: 0 for lt in LeaseType}
    for deal in deals:
        breakdown[deal.lease_type.value] += 1
    breakdown = {k: v for k, v in breakdown.items() if v > 0}

    result = dict(
        city=city.title(), state=state.upper(),
        deal_count=count, avg_rent_psf=avg, median_rent_psf=median,
        lease_type_breakdown=breakdown, cached=False,
    )
    cache_set(cache_key, result)
    return MarketSummaryResponse(**result)