from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from app.database import Base

class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer,ForeignKey("quizzes.id", ondelete="CASCADE"),nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("quiz_id", "student_id", name="uq_quiz_student"),
    )

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.quiz import Quiz
from app.models.quiz_question import QuizQuestion
from app.models.quiz_submission import QuizSubmission
from app.models.classroom_participant import ClassroomParticipant

def submit_quiz_and_score(
    db: Session,
    student_id: int,
    answers: dict
):
    student = db.query(User).filter(User.id == student_id).first()

    if not student:
        raise ValueError("Student not found")

    if student.role != "student":
        raise ValueError("Only students can submit quizzes")

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

    # Prevent double submission
    existing = (
        db.query(QuizSubmission)
        .filter(
            QuizSubmission.quiz_id == quiz.id,
            QuizSubmission.student_id == student_id
        )
        .first()
    )

    if existing:
        raise ValueError("Quiz already submitted")

    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.quiz_id == quiz.id)
        .all()
    )

    correct_map = {q.id: q.correct_option for q in questions}

    score = 0
    for qid, chosen in answers.items():
        qid = int(qid)
        if qid in correct_map and chosen == correct_map[qid]:
            score += 1

    submission = QuizSubmission(
        quiz_id=quiz.id,
        student_id=student_id,
        score=score
    )

    # Update classroom participant score
    participant = (
        db.query(ClassroomParticipant)
        .filter(
            ClassroomParticipant.classroom_id == student.current_classroom_id,
            ClassroomParticipant.student_id == student_id
        )
        .first()
    )

    if not participant:
        raise ValueError("Student is not registered in classroom")

    participant.score += score


    db.add(submission)
    db.commit()

    return score
