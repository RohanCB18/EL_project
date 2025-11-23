# backend/student-matching/models.py
from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Project(BaseModel):
    title: str
    description: str


class Student(BaseModel):
    name: str
    usn: str
    rvce_email: str

    branch: str
    section: str
    year: str

    cgpa: float = Field(0.0)
    average_EL_marks: float = Field(0.0)

    programming_languages: List[str] = []
    tech_skills: List[str] = []
    domain_interests: List[str] = []

    past_projects: List[Project] = []

    hackathon_participation_count: int = 0
    hackathon_achievement_level: Literal["none", "participant", "finalist", "winner"] = "none"

    project_completion_approach: Literal[
        "consistent_work", "deadline_driven", "weekend_sprinter", "flexible_any_style"
    ] = "flexible_any_style"

    commitment_type: Literal[
        "generally_available", "extracurricular_commitments", "technical_commitments", "low_commitment"
    ] = "generally_available"

    residence: Literal["day_scholar", "pg", "hostellite"] = "day_scholar"


class Filters(BaseModel):
    same_branch: Optional[bool] = False
    same_year: Optional[bool] = False
    branch_clusters: Optional[List[str]] = None  # list of cluster names user wants
    domain_interests: Optional[List[str]] = None
    min_score: Optional[float] = 0.0
    residence: Optional[List[str]] = None
    commitment_types: Optional[List[str]] = None
    project_approaches: Optional[List[str]] = None
    top_k: Optional[int] = None  # if provided, return top K matches
