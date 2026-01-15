from pydantic import BaseModel

class ClassroomCreate(BaseModel):
    room_name: str
    password: str


class ClassroomResponse(BaseModel):
    id: int
    room_name: str
    room_code: str
    is_active: bool

class ClassroomJoin(BaseModel):
    room_code: str
    password: str
    student_id: int

from typing import List

class StudentInClassroom(BaseModel):
    id: int
    name: str
    email: str
    score : int


class ClassroomStudentsResponse(BaseModel):
    classroom_id: int
    students: List[StudentInClassroom]
