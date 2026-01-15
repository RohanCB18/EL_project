from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class Project(BaseModel):
    title: str
    description: str


class Student(BaseModel):
    name: str
    usn: str
    rvce_email: str

    # Academic info
    branch: str
    year: str
    section: str
    cgpa: float = 0.0
    average_EL_marks: float = 0.0

    # Gender
    gender: Literal["male", "female", "other"]

    # Technical profile
    programming_languages: List[str] = Field(default_factory=list)
    tech_skills: List[str] = Field(default_factory=list)
    past_projects: List[Project] = Field(default_factory=list)
    domain_interests: List[str] = Field(default_factory=list)

    # Hackathon experience
    hackathon_participation_count: int = 0
    hackathon_achievement_level: Literal["none", "participant", "finalist", "winner"] = "none"

    # Work style & commitments
    project_completion_approach: Literal[
        "consistent_work",
        "deadline_driven",
        "weekend_sprinter",
        "flexible_any_style"
    ] = "flexible_any_style"

    commitment_preference: Literal[
        "generally_available",
        "extracurricular_commitments",
        "technical_commitments",
        "low_commitment"
    ] = "generally_available"

    # Residence
    residence: Literal["hostellite", "pg", "day_scholar"] = "day_scholar"


class Filters(BaseModel):
    same_gender_only: Optional[bool] = None
    same_branch_only: Optional[bool] = None
    same_year_only: Optional[bool] = None

    min_score: Optional[float] = None
    top_k: Optional[int] = None


class MatchRequest(BaseModel):
    students: List[Student]
    filters: Optional[Filters] = None
