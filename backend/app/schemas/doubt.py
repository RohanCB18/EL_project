from pydantic import BaseModel
from datetime import datetime
from typing import List

class DoubtCreate(BaseModel):
    content: str


class DoubtResponse(BaseModel):
    id: int
    student_name: str
    content: str
    created_at: datetime


class DoubtListResponse(BaseModel):
    classroom_id: int
    doubts: List[DoubtResponse]
