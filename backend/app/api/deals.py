from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import Optional

from app.db import get_db
from app.models.models import Deal, Tenant, Property, LeaseType
from app.schemas.schemas import (
    RawDealInput,
    ImportResult,
    ImportError,
    DealResponse,
    DealsListResponse,
)
from app.services.normalizer import normalize_record

router = APIRouter(prefix="/deals", tags=["deals"])


@router.post("/import", response_model=ImportResult)
def import_deals(records: list[RawDealInput], db: Session = Depends(get_db)):
    imported = 0
    skipped = 0
    errors: list[ImportError] = []
    seen_hashes: set[str] = set()

    for index, record in enumerate(records):
        raw = record.model_dump()
        result = normalize_record(raw, index)

        if not result.ok:
            for e in result.errors:
                errors.append(ImportError(
                    index=e.index,
                    field=e.field,
                    raw=e.raw,
                    reason=e.reason,
                ))
            continue

        deal = result.deal

        if deal.dedup_hash in seen_hashes:
            skipped += 1
            continue

        exists = db.query(Deal).filter(Deal.dedup_hash == deal.dedup_hash).first()
        if exists:
            skipped += 1
            continue

        seen_hashes.add(deal.dedup_hash)

        tenant = db.query(Tenant).filter(
            func.lower(Tenant.name) == deal.tenant_name.lower()
        ).first()
        if not tenant:
            tenant = Tenant(name=deal.tenant_name)
            db.add(tenant)
            db.flush()

        property_ = db.query(Property).filter(
            func.lower(Property.street) == deal.street.lower(),
            func.lower(Property.city) == deal.city.lower(),
            func.lower(Property.state) == deal.state.lower(),
        ).first()
        if not property_:
            property_ = Property(
                street=deal.street,
                city=deal.city,
                state=deal.state,
                zip=deal.zip,
            )
            db.add(property_)
            db.flush()

        new_deal = Deal(
            tenant_id=tenant.id,
            property_id=property_.id,
            size_sqft=deal.size_sqft,
            rent_psf=deal.rent_psf,
            lease_type=LeaseType(deal.lease_type),
            lease_start_date=deal.lease_start_date,
            lease_term_months=deal.lease_term_months,
            data_source=deal.data_source,
            raw_input=deal.raw_input,
            dedup_hash=deal.dedup_hash,
        )
        db.add(new_deal)
        imported += 1

    db.commit()
    return ImportResult(imported=imported, skipped=skipped, errors=errors)


@router.get("", response_model=DealsListResponse)
def list_deals(
    city: Optional[str] = None,
    state: Optional[str] = None,
    lease_type: Optional[str] = None,
    sqft_min: Optional[int] = None,
    sqft_max: Optional[int] = None,
    rent_min: Optional[float] = None,
    rent_max: Optional[float] = None,
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    sort_by: str = Query(default="created_at", pattern="^(rent_psf|size_sqft|created_at)$"),
    sort_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    q = (
        db.query(Deal)
        .join(Deal.tenant)
        .join(Deal.property)
        .options(joinedload(Deal.tenant), joinedload(Deal.property))
    )

    if city:
        q = q.filter(func.lower(Property.city) == city.lower())
    if state:
        q = q.filter(func.lower(Property.state) == state.lower())
    if lease_type:
        q = q.filter(Deal.lease_type == LeaseType(lease_type.upper()))
    if sqft_min is not None:
        q = q.filter(Deal.size_sqft >= sqft_min)
    if sqft_max is not None:
        q = q.filter(Deal.size_sqft <= sqft_max)
    if rent_min is not None:
        q = q.filter(Deal.rent_psf >= rent_min)
    if rent_max is not None:
        q = q.filter(Deal.rent_psf <= rent_max)
    if search:
        term = f"%{search.lower()}%"
        q = q.filter(or_(
            func.lower(Tenant.name).like(term),
            func.lower(Property.street).like(term),
            func.lower(Property.city).like(term),
        ))

    sort_col = {
        "rent_psf": Deal.rent_psf,
        "size_sqft": Deal.size_sqft,
        "created_at": Deal.created_at,
    }[sort_by]
    q = q.order_by(sort_col.desc() if sort_dir == "desc" else sort_col.asc())

    total = q.count()
    deals = q.offset((page - 1) * page_size).limit(page_size).all()

    return DealsListResponse(
        total=total,
        page=page,
        page_size=page_size,
        results=[DealResponse.from_orm_deal(d) for d in deals],
    )