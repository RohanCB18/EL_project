from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.classroom import Classroom
from app.models.quiz_question import QuizQuestion

def create_or_update_quiz_with_questions(
    db: Session,
    teacher_id: int,
    questions
):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher:
        raise ValueError("Teacher not found")

    if teacher.role != "teacher":
        raise ValueError("Only teachers can create quizzes")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("Teacher has no active classroom")

    quiz = (
        db.query(Quiz)
        .filter(Quiz.classroom_id == classroom.id)
        .first()
    )

    if not quiz:
        quiz = Quiz(classroom_id=classroom.id)
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

    if quiz.is_active:
        raise ValueError("Cannot modify quiz after it has started")

    question_objects = []

    for q in questions:
        question_objects.append(
            QuizQuestion(
                quiz_id=quiz.id,
                question_text=q.question_text,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                correct_option=q.correct_option
            )
        )

    db.add_all(question_objects)
    db.commit()

    return quiz.id, len(question_objects)

def start_quiz(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher:
        raise ValueError("Teacher not found")

    if teacher.role != "teacher":
        raise ValueError("Only teachers can start quizzes")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("Teacher has no active classroom")

    quiz = (
        db.query(Quiz)
        .filter(Quiz.classroom_id == classroom.id)
        .first()
    )

    if not quiz:
        raise ValueError("Quiz does not exist")

    if quiz.is_active:
        raise ValueError("Quiz already started")

    quiz.is_active = True
    db.commit()

    return quiz.id

from app.models.quiz import Quiz
from app.models.user import User
from app.models.classroom import Classroom

def delete_quiz(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher:
        raise ValueError("Teacher not found")

    if teacher.role != "teacher":
        raise ValueError("Only teachers can delete quizzes")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("Teacher has no active classroom")

    quiz = (
        db.query(Quiz)
        .filter(Quiz.classroom_id == classroom.id)
        .first()
    )

    if not quiz:
        raise ValueError("No quiz found")

    db.delete(quiz)
    db.commit()

def deactivate_quiz(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can deactivate quizzes")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("No active classroom")

    quiz = (
        db.query(Quiz)
        .filter(Quiz.classroom_id == classroom.id)
        .first()
    )

    if not quiz:
        raise ValueError("No quiz found")

    if not quiz.is_active:
        raise ValueError("Quiz is already inactive")

    quiz.is_active = False
    db.commit()

    return quiz.id

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.classroom import Classroom
from app.models.quiz import Quiz
from app.models.quiz_submission import QuizSubmission

def get_quiz_submissions_overview(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can view quiz submissions")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("No active classroom")

    quiz = (
        db.query(Quiz)
        .filter(Quiz.classroom_id == classroom.id)
        .first()
    )

    if not quiz:
        raise ValueError("No quiz found")

    submissions = (
        db.query(QuizSubmission, User)
        .join(User, User.id == QuizSubmission.student_id)
        .filter(QuizSubmission.quiz_id == quiz.id)
        .all()
    )

    return {
        "quiz_id": quiz.id,
        "total_submissions": len(submissions),
        "submissions": [
            {
                "student_id": user.id,
                "name": user.name,
                "email": user.email,
                "score": submission.score
            }
            for submission, user in submissions
        ]
    }
