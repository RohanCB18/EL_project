from pydantic import BaseModel
from typing import List

# ---------- REQUEST SCHEMAS ----------

class ClassroomCreate(BaseModel):
    room_name: str
    password: str


class ClassroomJoin(BaseModel):
    room_code: str
    password: str


# ---------- RESPONSE SCHEMAS ----------

class ClassroomResponse(BaseModel):
    id: int
    room_name: str
    room_code: str
    is_active: bool


class StudentInClassroom(BaseModel):
    id: int
    name: str
    email: str
    score: int


class ClassroomStudentsResponse(BaseModel):
    classroom_id: int
    students: List[StudentInClassroom]
