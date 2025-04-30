from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    text = Column(Text, nullable=False)
    preliminary_evaluation = Column(Integer, nullable=False) # Assuming 2-6 validation is handled at schema/API level

    thesis_id = Column(String, ForeignKey("thesis.id"), index=True, nullable=False)
    assistant_id = Column(String, ForeignKey("user.id"), index=True, nullable=False) # Corrected FK to point to 'user' table

    thesis = relationship("Thesis", back_populates="reviews")
    assistant = relationship("User", back_populates="reviews") # Assumes User model has a 'reviews' relationship defined 