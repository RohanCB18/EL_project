from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base

class ContestTemplateTestCase(Base):
    __tablename__ = "contest_template_test_cases"

    id = Column(Integer, primary_key=True, index=True)
    contest_template_question_id = Column(
        Integer,
        ForeignKey("contest_template_questions.id", ondelete="CASCADE"),
        nullable=False
    )

    input_data = Column(String, nullable=False)
    expected_output = Column(String, nullable=False)
    is_sample = Column(Boolean, default=False)
