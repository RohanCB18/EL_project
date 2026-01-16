from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class ContestTemplate(Base):
    __tablename__ = "contest_templates"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
