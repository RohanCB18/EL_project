from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import Session


from app.database import Base
from app.models.user import User

class ContestQuestion(Base):
    __tablename__ = "contest_questions"

    id = Column(Integer, primary_key=True, index=True)
    contest_id = Column(
        Integer,
        ForeignKey("contests.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    input_format = Column(String, nullable=False)
    output_format = Column(String, nullable=False)
    constraints = Column(String)
    time_limit_ms = Column(Integer, nullable=False)
    memory_limit_kb = Column(Integer, nullable=False)


