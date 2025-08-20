from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.db.base_class import Base


class RequestStatus(str, enum.Enum):
    requested = "requested"
    accepted = "accepted"
    declined = "declined"


class AssistantRequest(Base):
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign keys
    student_id = Column(String, ForeignKey("user.id"), nullable=False)
    assistant_id = Column(String, ForeignKey("user.id"), nullable=False)
    thesis_id = Column(String, ForeignKey("thesis.id"), nullable=False)
    
    # Status
    status = Column(Enum(RequestStatus), default=RequestStatus.REQUESTED, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)  # When accepted or declined
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id], overlaps="sent_requests")
    assistant = relationship("User", foreign_keys=[assistant_id], overlaps="received_requests")
    thesis = relationship("Thesis", back_populates="requests") 