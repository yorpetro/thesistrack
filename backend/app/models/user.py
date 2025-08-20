from sqlalchemy import Boolean, Column, String, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.base_class import Base


class UserRole(str, enum.Enum):
    student = "student"
    professor = "professor"
    graduation_assistant = "graduation_assistant"


class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    bio = Column(Text, nullable=True)
    profile_picture = Column(String, nullable=True)  # Path to profile picture file
    
    # OAuth related fields
    oauth_provider = Column(String, nullable=True)  # "google", "github", etc.
    oauth_id = Column(String, nullable=True)
    
    # Relationships
    theses = relationship("Thesis", back_populates="student", 
                          primaryjoin="and_(User.id==Thesis.student_id, User.role=='student')")
    supervised_theses = relationship("Thesis", back_populates="supervisor",
                                    primaryjoin="and_(User.id==Thesis.supervisor_id, User.role=='professor')")
    comments = relationship("ThesisComment", back_populates="user")
    events = relationship("Event", back_populates="user")
    
    # Assistant request relationships
    sent_requests = relationship("AssistantRequest", foreign_keys="AssistantRequest.student_id",
                               primaryjoin="User.id==AssistantRequest.student_id")
    received_requests = relationship("AssistantRequest", foreign_keys="AssistantRequest.assistant_id",
                                   primaryjoin="User.id==AssistantRequest.assistant_id")

    # Reviews relationship (for assistants)
    reviews = relationship("Review", back_populates="assistant", 
                           primaryjoin="and_(User.id==Review.assistant_id, User.role=='graduation_assistant')") 