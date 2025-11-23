# backend/student-matching/match_engine.py
from typing import List, Dict, Any
import numpy as np
from models import Student, Filters
from embeddings import get_embedding_for_profile
from rule_engine import compute_rule_score
import math

def build_profile_text(student: Student) -> str:
    # Create a semantic profile text used for embeddings
    lines = []
    if student.programming_languages:
        lines.append("Programming languages: " + ", ".join(student.programming_languages) + ".")
    if student.tech_skills:
        lines.append("Tech skills: " + ", ".join(student.tech_skills) + ".")
    if student.domain_interests:
        lines.append("Domain interests: " + ", ".join(student.domain_interests) + ".")
    if student.past_projects:
        proj_lines = []
        for p in student.past_projects:
            proj_lines.append(f"{p.title} - {p.description}")
        lines.append("Past projects: " + " ; ".join(proj_lines) + ".")
    # hackathon info (count + level)
    if student.hackathon_participation_count > 0:
        lines.append(f"Hackathon: participated in {student.hackathon_participation_count} hackathons; achievement level: {student.hackathon_achievement_level}.")
    else:
        lines.append(f"Hackathon: no hackathon participation; achievement level: {student.hackathon_achievement_level}.")
    # EL marks category mapping (use simple textual mapping)
    el = student.average_EL_marks
    if el >= 95:
        el_cat = "Outstanding project performance (95+ EL marks)."
    elif el >= 90:
        el_cat = "Excellent project performance (90+ EL marks)."
    elif el >= 85:
        el_cat = "Very strong project performance (85+ EL marks)."
    elif el >= 80:
        el_cat = "Strong project performance (80+ EL marks)."
    elif el >= 70:
        el_cat = "Above-average project performance (70+ EL marks)."
    elif el >= 60:
        el_cat = "Average project performance (60+ EL marks)."
    elif el >= 50:
        el_cat = "Below-average project performance (50+ EL marks)."
    else:
        el_cat = "Weak project performance (EL marks below 50)."
    lines.append("Project performance category: " + el_cat)
    return "\n".join(lines)

def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    if a is None or b is None:
        return 0.0
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

def compute_semantic_score(profile_i_vec: np.ndarray, profile_j_vec: np.ndarray) -> float:
    sim = _cosine_sim(profile_i_vec, profile_j_vec)  # -1..1
    # convert to 0..100
    norm = ((sim + 1.0) / 2.0) * 100.0
    return round(norm, 2)

def apply_filters_pool(students: List[Student], filters: Filters) -> List[Student]:
    # Filters applied before matching. If a filter is not set, it is ignored.
    pool = students
    if filters.same_branch:
        pool = [s for s in pool if s.branch == students[0].branch]
    if filters.same_year:
        pool = [s for s in pool if s.year == students[0].year]
    if filters.domain_interests:
        pool = [s for s in pool if set(filters.domain_interests) & set(s.domain_interests)]
    if filters.residence:
        pool = [s for s in pool if s.residence in filters.residence]
    if filters.commitment_types:
        pool = [s for s in pool if s.commitment_type in filters.commitment_types]
    if filters.project_approaches:
        pool = [s for s in pool if s.project_completion_approach in filters.project_approaches]
    return pool

def match_students_hybrid(students: List[Student], filters: Filters = None, 
                          semantic_weight: float = 0.6, rule_weight: float = 0.4):
    """
    students: list of Student objects (full list)
    filters: Filters object (optional)
    Returns matches array sorted by final_score desc
    """
    if filters is None:
        from models import Filters as _F
        filters = _F()

    # Apply filters relative to first student (if intended). We'll treat filters as pool filters.
    pool = apply_filters_pool(students, filters)

    # Precompute embeddings for pool
    embeddings = {}
    profiles = {}
    for s in pool:
        text = build_profile_text(s)
        vec = get_embedding_for_profile(text, s.usn)
        embeddings[s.usn] = vec
        profiles[s.usn] = text

    matches = []
    n = len(pool)
    for i in range(n):
        for j in range(i+1, n):
            s1 = pool[i]
            s2 = pool[j]
            # rule-based
            rule_score = compute_rule_score(s1, s2)
            # semantic
            vec1 = embeddings[s1.usn]
            vec2 = embeddings[s2.usn]
            semantic_score = compute_semantic_score(vec1, vec2)
            # hybrid
            final = round(semantic_weight * semantic_score + rule_weight * rule_score, 2)
            matches.append({
                "student1": s1.name,
                "student2": s2.name,
                "usn1": s1.usn,
                "usn2": s2.usn,
                "semantic_score": semantic_score,
                "rule_score": rule_score,
                "final_score": final
            })

    # filter by min_score if provided
    if filters.min_score:
        matches = [m for m in matches if m["final_score"] >= filters.min_score]

    matches.sort(key=lambda x: x["final_score"], reverse=True)
    if filters.top_k:
        matches = matches[:filters.top_k]
    return {"matches": matches}
