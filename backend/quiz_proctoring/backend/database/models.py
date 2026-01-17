"""
SQLite Database Models for Quiz Proctoring System
DEMO ONLY - Local SQLite database for evidence metadata storage
"""
from sqlalchemy import create_engine, Column, String, Float, DateTime, ForeignKey, Integer, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import hashlib

Base = declarative_base()


class ProctorSession(Base):
    """Records for proctoring sessions."""
    __tablename__ = 'proctor_sessions'
    
    session_id = Column(String, primary_key=True)
    student_id = Column(String, nullable=False)
    quiz_id = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    
    # Relationship to cheating events
    events = relationship("CheatingEvent", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ProctorSession(session_id='{self.session_id}', student_id='{self.student_id}', quiz_id='{self.quiz_id}')>"


class CheatingEvent(Base):
    """Records for detected cheating events."""
    __tablename__ = 'cheating_events'
    
    id = Column(String, primary_key=True)  # UUID
    session_id = Column(String, ForeignKey('proctor_sessions.session_id'), nullable=False)
    event_type = Column(String, nullable=False)  # "GAZE_AVERSION" or "FORBIDDEN_OBJECT"
    reason = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    image_path = Column(String, nullable=True)  # Path to screenshot
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship to session
    session = relationship("ProctorSession", back_populates="events")
    
    def __repr__(self):
        return f"<CheatingEvent(id='{self.id}', type='{self.event_type}', confidence={self.confidence})>"


# Authentication and Quiz Management Tables

class Student(Base):
    """Student authentication table."""
    __tablename__ = 'students'
    
    email = Column(String, primary_key=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship to attempts
    attempts = relationship("StudentAttempt", back_populates="student", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Student(email='{self.email}')>"
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        """Verify a password against the stored hash."""
        return self.password_hash == Student.hash_password(password)


class Teacher(Base):
    """Teacher authentication table."""
    __tablename__ = 'teachers'
    
    email = Column(String, primary_key=True)
    password_hash = Column(String, nullable=False)
    subject = Column(String, nullable=False)  # 'adld', 'dsa', or 'os'
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship to quizzes
    quizzes = relationship("Quiz", back_populates="teacher", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Teacher(email='{self.email}', subject='{self.subject}')>"
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using SHA-256."""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        """Verify a password against the stored hash."""
        return self.password_hash == Teacher.hash_password(password)


class Quiz(Base):
    """Quiz table."""
    __tablename__ = 'quizzes'
    
    quiz_id = Column(String, primary_key=True)  # UUID
    teacher_email = Column(String, ForeignKey('teachers.email'), nullable=False)
    subject = Column(String, nullable=False)  # 'adld', 'dsa', or 'os'
    title = Column(String, nullable=False)
    time_limit = Column(Integer, nullable=False)  # In seconds
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.question_order")
    attempts = relationship("StudentAttempt", back_populates="quiz", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Quiz(quiz_id='{self.quiz_id}', title='{self.title}')>"


class QuizQuestion(Base):
    """Quiz question table - links to quiz and stores question data."""
    __tablename__ = 'quiz_questions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(String, ForeignKey('quizzes.quiz_id'), nullable=False)
    question_order = Column(Integer, nullable=False)  # Order in quiz
    question_text = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False)  # 'A', 'B', 'C', or 'D' or actual text
    is_custom = Column(Boolean, nullable=False, default=False)  # True if added by teacher
    
    # Relationship
    quiz = relationship("Quiz", back_populates="questions")
    
    def __repr__(self):
        return f"<QuizQuestion(id={self.id}, quiz_id='{self.quiz_id}')>"


class StudentAttempt(Base):
    """Student quiz attempt table."""
    __tablename__ = 'student_attempts'
    
    attempt_id = Column(String, primary_key=True)  # UUID
    student_email = Column(String, ForeignKey('students.email'), nullable=False)
    quiz_id = Column(String, ForeignKey('quizzes.quiz_id'), nullable=False)
    session_id = Column(String, ForeignKey('proctor_sessions.session_id'), nullable=True)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    score = Column(Float, nullable=True)  # Calculated after submission
    submitted = Column(Boolean, nullable=False, default=False)
    auto_submitted = Column(Boolean, nullable=False, default=False)  # True if browser violation
    
    # Relationships
    student = relationship("Student", back_populates="attempts")
    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<StudentAttempt(attempt_id='{self.attempt_id}', student='{self.student_email}')>"


class StudentAnswer(Base):
    """Student answer table."""
    __tablename__ = 'student_answers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    attempt_id = Column(String, ForeignKey('student_attempts.attempt_id'), nullable=False)
    question_id = Column(Integer, ForeignKey('quiz_questions.id'), nullable=False)
    selected_answer = Column(String, nullable=True)  # 'A', 'B', 'C', 'D', or actual text
    is_correct = Column(Boolean, nullable=True)  # Calculated on submission
    
    # Relationship
    attempt = relationship("StudentAttempt", back_populates="answers")
    
    def __repr__(self):
        return f"<StudentAnswer(id={self.id}, attempt_id='{self.attempt_id}')>"


# Database initialization
DATABASE_PATH = "backend/database/proctoring.db"


def init_database():
    """Initialize the database and create tables if they don't exist."""
    # Ensure directory exists
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    # Create engine
    engine = create_engine(f'sqlite:///{DATABASE_PATH}', echo=False)
    
    # Create tables
    Base.metadata.create_all(engine)
    
    return engine


def get_session_maker():
    """Get a SQLAlchemy session maker."""
    engine = init_database()
    SessionMaker = sessionmaker(bind=engine)
    return SessionMaker


def get_db_session():
    """Get a database session instance."""
    SessionMaker = get_session_maker()
    return SessionMaker()


# Demo note
print("=" * 60)
print("DATABASE MODULE LOADED")
print("=" * 60)
print("⚠️  DEMO ONLY - Using local SQLite database")
print(f"📁 Database path: {DATABASE_PATH}")
print("=" * 60)
