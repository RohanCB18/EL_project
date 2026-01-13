from pydantic import BaseModel
from typing import List

class QuizQuestionCreate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str  # "A" | "B" | "C" | "D"


class QuizCreateWithQuestions(BaseModel):
    teacher_id: int
    questions: List[QuizQuestionCreate]

class QuizSubmissionCreate(BaseModel):
    student_id: int
    answers: dict  # {question_id: "A" | "B" | "C" | "D"}

class QuizQuestionStudent(BaseModel):
    id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
