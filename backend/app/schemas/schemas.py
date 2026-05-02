from datetime import date
from typing import Optional
from pydantic import BaseModel


class RawDealInput(BaseModel):
    model_config = {"extra": "allow"}
    tenant:       Optional[str | int | float] = None
    address:      Optional[str] = None
    size:         Optional[str | int | float] = None
    rent:         Optional[str | int | float] = None
    lease_type:   Optional[str] = None
    start_date:   Optional[str] = None
    term_months:  Optional[str | int] = None
    source:       Optional[str] = None


class ImportError(BaseModel):
    index:  int
    field:  str
    raw:    str
    reason: str


class ImportResult(BaseModel):
    imported: int
    skipped:  int
    errors:   list[ImportError]


class JobResponse(BaseModel):
    job_id:  str
    status:  str
    message: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: Optional[ImportResult] = None
    error:  Optional[str] = None


class DealResponse(BaseModel):
    model_config = {"from_attributes": True}
    id:                str
    tenant_name:       str
    street:            str
    city:              str
    state:             str
    zip:               Optional[str]
    size_sqft:         int
    rent_psf:          float
    lease_type:        str
    lease_start_date:  date
    lease_term_months: Optional[int]
    data_source:       Optional[str]
    anomaly_flags:     list[str]
    created_at:        str

    @classmethod
    def from_orm_deal(cls, deal) -> "DealResponse":
        return cls(
            id=deal.id,
            tenant_name=deal.tenant.name,
            street=deal.property.street,
            city=deal.property.city,
            state=deal.property.state,
            zip=deal.property.zip,
            size_sqft=deal.size_sqft,
            rent_psf=float(deal.rent_psf),
            lease_type=deal.lease_type.value,
            lease_start_date=deal.lease_start_date,
            lease_term_months=deal.lease_term_months,
            data_source=deal.data_source,
            anomaly_flags=deal.anomaly_flags or [],
            created_at=deal.created_at.isoformat(),
        )


class DealsListResponse(BaseModel):
    total:     int
    page:      int
    page_size: int
    results:   list[DealResponse]


class MarketSummaryResponse(BaseModel):
    city:                 str
    state:                str
    deal_count:           int
    avg_rent_psf:         Optional[float]
    median_rent_psf:      Optional[float]
    lease_type_breakdown: dict[str, int]
    cached:               bool = False