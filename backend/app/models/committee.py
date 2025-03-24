from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.db.base_class import Base


class CommitteeMemberRole(str, enum.Enum):
    CHAIR = "chair"
    REVIEWER = "reviewer"
    ADVISOR = "advisor"
    EXTERNAL = "external"


class ThesisCommitteeMember(Base):
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    role = Column(Enum(CommitteeMemberRole), nullable=False)
    
    # Status tracking
    has_approved = Column(Boolean, default=False)
    approval_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    thesis_id = Column(String, ForeignKey("thesis.id"), nullable=False)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    
    # Relationships
    thesis = relationship("Thesis", back_populates="committee_members")
    user = relationship("User") 