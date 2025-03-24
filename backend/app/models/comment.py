from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
from datetime import datetime
import uuid

from app.db.base_class import Base


class ThesisComment(Base):
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    content = Column(Text, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_resolved = Column(Boolean, default=False)
    
    # Foreign keys
    thesis_id = Column(String, ForeignKey("thesis.id"), nullable=False)
    user_id = Column(String, ForeignKey("user.id"), nullable=False)
    
    # Optional parent comment reference for threaded comments
    parent_id = Column(String, ForeignKey("thesiscomment.id"), nullable=True)
    
    # Relationships
    thesis = relationship("Thesis", back_populates="comments")
    user = relationship("User", back_populates="comments")
    replies = relationship("ThesisComment", 
                          backref=backref("parent", remote_side=[id]),
                          cascade="all, delete-orphan") 