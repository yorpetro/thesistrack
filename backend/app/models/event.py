from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base_class import Base


class Event(Base):
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Time information
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    # Metadata and flags
    is_all_day = Column(Boolean, default=False)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Optional thesis reference
    thesis_id = Column(String, ForeignKey("thesis.id"), nullable=True)
    
    # Foreign keys
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="events")
    thesis = relationship("Thesis", overlaps="student,supervisor") 