from sqlalchemy import Column, String, DateTime, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.base_class import Base


class DeadlineType(str, enum.Enum):
    SUBMISSION = "submission"
    REVIEW = "review"
    DEFENSE = "defense"
    REVISION = "revision"


class Deadline(Base):
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)  # Location for defense deadlines
    
    # Deadline information
    deadline_date = Column(DateTime, nullable=False)
    deadline_type = Column(Enum(DeadlineType), nullable=False)
    
    # Flags
    is_active = Column(Boolean, default=True)
    is_global = Column(Boolean, default=True)  # Global deadlines apply to all students
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # For future extension: thesis-specific deadlines
    # thesis_id = Column(String, ForeignKey("thesis.id"), nullable=True)
    
    def __repr__(self):
        return f"<Deadline {self.title} - {self.deadline_date}>" 