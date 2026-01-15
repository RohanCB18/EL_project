from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Session

from app.database import Base
from app.models.user import User 

class ContestTestCase(Base):
    __tablename__ = "contest_test_cases"

    id = Column(Integer, primary_key=True, index=True)
    contest_question_id = Column(
        Integer,
        ForeignKey("contest_questions.id", ondelete="CASCADE"),
        nullable=False
    )
    input_data = Column(String, nullable=False)
    expected_output = Column(String, nullable=False)
    is_sample = Column(Boolean, default=False)


