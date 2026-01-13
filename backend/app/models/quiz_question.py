from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import Session
from app.database import Base
from app.models.quiz import Quiz

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer,ForeignKey("quizzes.id", ondelete="CASCADE"),nullable=False)

    question_text = Column(String, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)

    correct_option = Column(String, nullable=False)  # "A" | "B" | "C" | "D"

from app.models.quiz import User

def get_active_quiz_questions_for_student(
    db: Session,
    student_id: int
):
    student = db.query(User).filter(User.id == student_id).first()

    if not student:
        raise ValueError("Student not found")

    if student.role != "student":
        raise ValueError("Only students can access quizzes")

    if student.current_classroom_id is None:
        raise ValueError("Student is not in a classroom")

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.classroom_id == student.current_classroom_id,
            Quiz.is_active == True
        )
        .first()
    )

    if not quiz:
        raise ValueError("No active quiz")

    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.quiz_id == quiz.id)
        .all()
    )

    return quiz.id, questions
