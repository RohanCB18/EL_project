from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from app.database import Base

class ContestTemplateQuestion(Base):
    __tablename__ = "contest_template_questions"

    id = Column(Integer, primary_key=True, index=True)
    contest_template_id = Column(
        Integer,
        ForeignKey("contest_templates.id", ondelete="CASCADE"),
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
