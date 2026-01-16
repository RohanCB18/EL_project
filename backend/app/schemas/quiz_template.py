from pydantic import BaseModel
from typing import List

class QuizTemplateQuestionCreate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str

class QuizTemplateCreate(BaseModel):
    title: str
    questions: List[QuizTemplateQuestionCreate]

class QuizTemplateSummary(BaseModel):
    id: int
    title: str

class QuizTemplateDetail(BaseModel):
    id: int
    title: str
    questions: List[QuizTemplateQuestionCreate]
