from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Session

from app.database import Base
from app.models.user import User
from app.models.contest_test_case import ContestTestCase
from app.models.classroom_participant import ClassroomParticipant


class ContestSubmission(Base):
    __tablename__ = "contest_submissions"

    id = Column(Integer, primary_key=True, index=True)
    contest_id = Column(Integer, ForeignKey("contests.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id"))
    source_code = Column(String, nullable=False)
    language_id = Column(Integer, nullable=False)
    score = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("contest_id", "student_id", name="uq_contest_student"),
    )


