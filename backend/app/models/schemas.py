from pydantic import BaseModel
from typing import Optional, List


# -------------------------
# Request Models
# -------------------------

class QuestionRequest(BaseModel):
    """Request model for asking questions about uploaded PDF."""
    question: str
    session_id: str


class QuestionPaperRequest(BaseModel):
    """Request model for teacher question paper generation."""
    session_id: str
    topic: str
    num_questions: int = 10
    difficulty: str = "medium"
    include_answers: bool = False
    test_mode: str = "mcq"  # mcq, theory (short+long), hybrid
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


class QuestionPaperResponse(BaseModel):
    """Response model for question paper generation."""
    success: bool
    title: str
    instructions: str
    sections: List[dict]
    total_marks: int
    duration: Optional[str] = None


class ErrorResponse(BaseModel):
    """Generic error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
