from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class QuizTemplateQuestion(Base):
    __tablename__ = "quiz_template_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_template_id = Column(
        Integer,
        ForeignKey("quiz_templates.id", ondelete="CASCADE"),
        nullable=False
    )

    question_text = Column(String, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_option = Column(String, nullable=False)  # A/B/C/D
