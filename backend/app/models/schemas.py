from pydantic import BaseModel
from typing import Optional, List


# -------------------------
# Request Models
# -------------------------

class QuestionRequest(BaseModel):
    """Request model for asking questions about uploaded PDF."""
    question: str
    session_id: str


class SummaryRequest(BaseModel):
    """Request model for generating PDF summary."""
    session_id: str
    max_length: Optional[int] = 500


class QuizRequest(BaseModel):
    """Request model for generating quiz from PDF."""
    session_id: str
    num_questions: Optional[int] = 5
    difficulty: Optional[str] = "medium"  # easy, medium, hard


class QuestionPaperRequest(BaseModel):
    """Request model for teacher question paper generation."""
    session_id: str
    topic: str
    num_questions: int = 10
    difficulty: str = "medium"
    include_answers: bool = False
    question_types: Optional[List[str]] = ["mcq", "short_answer", "long_answer"]


# -------------------------
# Response Models
# -------------------------

class UploadResponse(BaseModel):
    """Response model for PDF upload."""
    success: bool
    message: str
    session_id: str
    filename: str


class AnswerResponse(BaseModel):
    """Response model for Q&A."""
    success: bool
    answer: str
    sources: Optional[List[str]] = None


class SummaryResponse(BaseModel):
    """Response model for summary generation."""
    success: bool
    summary: str


class QuizQuestion(BaseModel):
    """Single quiz question model."""
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None


class QuizResponse(BaseModel):
    """Response model for quiz generation."""
    success: bool
    quiz: List[QuizQuestion]


class QuestionPaperResponse(BaseModel):
    """Response model for question paper generation."""
    success: bool
    title: str
    instructions: str
    sections: List[dict]
    total_marks: int


class ErrorResponse(BaseModel):
    """Generic error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
