import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Numeric, Date,
    DateTime, ForeignKey, JSON, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from app.db import Base
import enum


class LeaseType(str, enum.Enum):
    NNN = "NNN"
    GROSS = "GROSS"
    MODIFIED = "MODIFIED"
    UNKNOWN = "UNKNOWN"


def new_uuid() -> str:
    return str(uuid.uuid4())


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    deals = relationship("Deal", back_populates="tenant")


class Property(Base):
    __tablename__ = "properties"

    id = Column(String, primary_key=True, default=new_uuid)
    street = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String(2), nullable=False)
    zip = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    deals = relationship("Deal", back_populates="property")


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, default=new_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)
    size_sqft = Column(Integer, nullable=False)
    rent_psf = Column(Numeric(10, 2), nullable=False)
    lease_type = Column(SAEnum(LeaseType), nullable=False)
    lease_start_date = Column(Date, nullable=False)
    lease_term_months = Column(Integer, nullable=True)
    data_source = Column(String, nullable=True)
    raw_input = Column(JSON, nullable=True)
    dedup_hash = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="deals")
    property = relationship("Property", back_populates="deals")
