from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import Session
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)  # "teacher" | "student"
    current_classroom_id = Column(Integer,ForeignKey("classrooms.id", ondelete="SET NULL"), nullable=True)


def login_or_create_user(db: Session, name: str, email: str, role: str) -> User:
    if role not in ["teacher", "student"]:
        raise ValueError("Invalid role")

    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    user = User(name=name, email=email, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
