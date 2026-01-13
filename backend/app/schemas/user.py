from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    role: str  # "teacher" or "student"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        orm_mode = True
