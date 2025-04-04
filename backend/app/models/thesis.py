from sqlalchemy import Column, String, DateTime, Enum, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.db.base_class import Base


class ThesisStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    NEEDS_REVISION = "needs_revision"
    APPROVED = "approved"
    DECLINED = "declined"


class Thesis(Base):
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, index=True)
    abstract = Column(Text, nullable=True)
    status = Column(Enum(ThesisStatus), default=ThesisStatus.DRAFT, nullable=False)
    
    # Document paths/metadata
    document_path = Column(String, nullable=True)  # Main document path
    document_type = Column(String, nullable=True)  # MIME type
    document_size = Column(Integer, nullable=True)  # In bytes
    
    # Dates
    submission_date = Column(DateTime, nullable=True)
    approval_date = Column(DateTime, nullable=True)
    defense_date = Column(DateTime, nullable=True)
    
    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    student_id = Column(String, ForeignKey("user.id"), nullable=False)
    supervisor_id = Column(String, ForeignKey("user.id"), nullable=True)
    
    # Relationships
    student = relationship("User", back_populates="theses", foreign_keys=[student_id])
    supervisor = relationship("User", back_populates="supervised_theses", foreign_keys=[supervisor_id])
    comments = relationship("ThesisComment", back_populates="thesis", cascade="all, delete-orphan")
    attachments = relationship("ThesisAttachment", back_populates="thesis", cascade="all, delete-orphan")
    committee_members = relationship("ThesisCommitteeMember", back_populates="thesis", cascade="all, delete-orphan")
    requests = relationship("AssistantRequest", back_populates="thesis", cascade="all, delete-orphan") 