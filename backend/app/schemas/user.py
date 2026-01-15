from pydantic import BaseModel

# ---------- REQUEST SCHEMA ----------

class UserCreate(BaseModel):
    name: str
    email: str
    role: str  # "teacher" or "student"


# ---------- RESPONSE SCHEMA ----------

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    access_token: str

    class Config:
        orm_mode = True
