from fastapi import FastAPI, HTTPException
from typing import List
from models import Student, Filters, MatchRequest
from match_engine import match_students_hybrid
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise Exception("Gemini API key not found. Add it to your .env file.")

app = FastAPI(title="elevAIte - Student Matching")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "student-matching service",
        "version": "1.0",
        "gemini_key_loaded": bool(GEMINI_API_KEY)
    }

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/match-students-ai")
def match_students_ai(req: MatchRequest):
    students = req.students
    filters = req.filters

    if not students or len(students) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two students.")

    return match_students_hybrid(students, filters)

@app.post("/embed-profile")
def embed_profile(student: Student):
    from match_engine import build_profile_text
    from embeddings import get_embedding_for_profile
    text = build_profile_text(student)
    vec = get_embedding_for_profile(text, student.usn)
    return {
        "usn": student.usn,
        "profile_text": text,
        "embedding_length": len(vec)
    }
