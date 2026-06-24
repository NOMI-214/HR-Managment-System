import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PlanType(str, enum.Enum):
    FREE = "FREE"
    STARTER = "STARTER"
    BUSINESS = "BUSINESS"
    ENTERPRISE = "ENTERPRISE"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    plan = Column(Enum(PlanType), default=PlanType.FREE)
    max_employees = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    starts_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="subscriptions")
