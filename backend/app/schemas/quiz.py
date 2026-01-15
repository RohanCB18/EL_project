from pydantic import BaseModel
from typing import List, Dict

# ---------- REQUEST SCHEMAS ----------

class QuizQuestionCreate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str  # "A" | "B" | "C" | "D"


class QuizCreateWithQuestions(BaseModel):
    questions: List[QuizQuestionCreate]


class QuizSubmissionCreate(BaseModel):
    answers: Dict[int, str]  # {question_id: "A" | "B" | "C" | "D"}


# ---------- RESPONSE SCHEMAS ----------

class QuizQuestionStudent(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
