from sqlalchemy import Column, String, Text, ForeignKey, Float, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.db.base_class import Base


class ReviewStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class Review(Base):
    __tablename__ = "review"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    thesis_id = Column(String, ForeignKey("thesis.id"), nullable=False)
    assistant_id = Column(String, ForeignKey("user.id"), nullable=False)
    status = Column(Enum(ReviewStatus), default=ReviewStatus.pending, nullable=False)
    comments = Column(Text, nullable=True)
    grade = Column(Float, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    thesis = relationship("Thesis", back_populates="reviews")
    assistant = relationship("User", back_populates="reviews")