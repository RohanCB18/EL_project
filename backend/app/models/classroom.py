from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.database import Base
import random
import string
from sqlalchemy.orm import Session
from app.models.user import User

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    room_code = Column(String, unique=True, index=True, nullable=False)
    room_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def generate_room_code(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def create_or_get_classroom(
    db: Session,
    teacher_id: int,
    room_name: str,
    password: str
):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher:
        raise ValueError("User not found")

    if teacher.role != "teacher":
        raise ValueError("Only teachers can create classrooms")

    # Check if teacher already has an active classroom
    existing = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id, Classroom.is_active == True)
        .first()
    )

    if existing:
        return existing

    classroom = Classroom(
        teacher_id=teacher_id,
        room_code=generate_room_code(),
        room_password=password,
        is_active=True
    )

    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    return classroom

from app.models.classroom_participant import ClassroomParticipant

def join_classroom(
    db: Session,
    student_id: int,
    room_code: str,
    password: str
):
    student = db.query(User).filter(User.id == student_id).first()

    if not student:
        raise ValueError("Student not found")

    if student.role != "student":
        raise ValueError("Only students can join classrooms")

    if student.current_classroom_id is not None:
        raise ValueError("Student already in a classroom")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.room_code == room_code, Classroom.is_active == True)
        .first()
    )

    if not classroom:
        raise ValueError("Classroom not found or inactive")

    if classroom.room_password != password:
        raise ValueError("Incorrect room password")

    # Add participant entry
    participant = ClassroomParticipant(
        classroom_id=classroom.id,
        student_id=student.id
    )

    student.current_classroom_id = classroom.id

    db.add(participant)
    db.commit()

    return classroom

def leave_classroom(db: Session, student_id: int):
    student = db.query(User).filter(User.id == student_id).first()

    if not student:
        raise ValueError("Student not found")

    if student.role != "student":
        raise ValueError("Only students can leave classrooms")

    if student.current_classroom_id is None:
        raise ValueError("Student is not in any classroom")

    # Remove participant entry
    db.query(ClassroomParticipant).filter(
        ClassroomParticipant.student_id == student_id
    ).delete()

    student.current_classroom_id = None
    db.commit()

def end_classroom(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher:
        raise ValueError("Teacher not found")

    if teacher.role != "teacher":
        raise ValueError("Only teachers can end classrooms")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("No classroom found")

    classroom_id = classroom.id

    # 1. Remove all participants
    db.query(ClassroomParticipant).filter(
        ClassroomParticipant.classroom_id == classroom_id
    ).delete()

    # 2. Reset students
    db.query(User).filter(
        User.current_classroom_id == classroom_id
    ).update({User.current_classroom_id: None})

    # 3. Reset teacher
    teacher.current_classroom_id = None

    # 4. Delete classroom
    db.delete(classroom)
    db.commit()

def get_students_in_classroom(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher:
        raise ValueError("Teacher not found")

    if teacher.role != "teacher":
        raise ValueError("Only teachers can view students")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("No active classroom found")

    students = (
        db.query(
            User,
            ClassroomParticipant.score
        )
        .join(
            ClassroomParticipant,
            ClassroomParticipant.student_id == User.id
        )
        .filter(ClassroomParticipant.classroom_id == classroom.id)
        .all()
    )

    return classroom.id, students
