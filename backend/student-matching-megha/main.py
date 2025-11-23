# backend/student-matching/main.py
from fastapi import FastAPI, HTTPException
from typing import List
from models import Student, Filters
from match_engine import match_students_hybrid
import json
from fastapi.middleware.cors import CORSMiddleware

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
    return {"status": "student-matching service", "version": "1.0"}

@app.post("/match-students-ai")
def match_students_ai(students: List[Student], filters: Filters = None):
    if not students or len(students) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two students in the list.")
    result = match_students_hybrid(students, filters)
    return result

@app.post("/embed-profile")
def embed_profile(student: Student):
    # a helper endpoint to generate and return an embedding for one student profile (for debugging)
    from match_engine import build_profile_text
    from embeddings import get_embedding_for_profile
    text = build_profile_text(student)
    vec = get_embedding_for_profile(text, student.usn)
    return {"usn": student.usn, "profile_text": text, "embedding_length": len(vec)}
