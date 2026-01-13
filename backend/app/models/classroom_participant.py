from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class ClassroomParticipant(Base):
    __tablename__ = "classroom_participants"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, default=0)
    joined_at = Column(DateTime, default=datetime.utcnow)
