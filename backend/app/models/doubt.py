from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.database import Base

class Doubt(Base):
    __tablename__ = "doubts"

    id = Column(Integer, primary_key=True, index=True)

    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False
    )

    student_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.classroom import Classroom
from app.models.classroom_participant import ClassroomParticipant
from app.models.doubt import Doubt

def create_doubt(db: Session, student_id: int, content: str):
    student = db.query(User).filter(User.id == student_id).first()

    if not student or student.role != "student":
        raise ValueError("Only students can ask doubts")

    if student.current_classroom_id is None:
        raise ValueError("Student is not in a classroom")

    doubt = Doubt(
        classroom_id=student.current_classroom_id,
        student_id=student_id,
        content=content
    )

    db.add(doubt)
    db.commit()
    db.refresh(doubt)

    return doubt.id

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.classroom import Classroom
from app.models.doubt import Doubt

def get_doubts_for_classroom(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise ValueError("User not found")

    # Resolve classroom based on role
    if user.role == "student":
        if user.current_classroom_id is None:
            raise ValueError("User is not in a classroom")
        classroom_id = user.current_classroom_id

    elif user.role == "teacher":
        classroom = (
            db.query(Classroom)
            .filter(Classroom.teacher_id == user.id)
            .first()
        )
        if not classroom:
            raise ValueError("Teacher has no active classroom")
        classroom_id = classroom.id

    else:
        raise ValueError("Invalid user role")

    doubts = (
        db.query(Doubt, User)
        .join(User, User.id == Doubt.student_id)
        .filter(Doubt.classroom_id == classroom_id)
        .order_by(Doubt.created_at.asc())
        .all()
    )

    return classroom_id, [
        {
            "id": doubt.id,
            "student_name": student.name,
            "content": doubt.content,
            "created_at": doubt.created_at
        }
        for doubt, student in doubts
    ]



def delete_doubt(db: Session, teacher_id: int, doubt_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can delete doubts")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("No active classroom")

    doubt = (
        db.query(Doubt)
        .filter(
            Doubt.id == doubt_id,
            Doubt.classroom_id == classroom.id
        )
        .first()
    )

    if not doubt:
        raise ValueError("Doubt not found")

    db.delete(doubt)
    db.commit()

def clear_all_doubts(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can clear doubts")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("No active classroom")

    db.query(Doubt).filter(
        Doubt.classroom_id == classroom.id
    ).delete()

    db.commit()
