"""
SQLite Database Models for Quiz Proctoring System
DEMO ONLY - Local SQLite database for evidence metadata storage
"""
from sqlalchemy import create_engine, Column, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

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
