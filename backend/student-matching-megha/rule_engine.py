# backend/student-matching/rule_engine.py
from typing import Tuple
from models import Student

# We apply the exact rule set you specified and the final applied changes.
# We compute a raw rule score and also the maximum possible raw score so we can normalize.

# We use cluster mapping for "same cluster" logic. Edit clusters as needed.
BRANCH_CLUSTERS = {
    "cluster_cs": {"CSE", "ISE", "AIML", "DS"},
    "cluster_elec": {"ECE", "EEE", "ETE"},
    "cluster_mech": {"ME", "IPE", "AUE"},
    "cluster_civil": {"CIV", "ARCH"}
}

def _same_cluster(b1: str, b2: str) -> bool:
    for cluster in BRANCH_CLUSTERS.values():
        if b1 in cluster and b2 in cluster:
            return True
    return False

def _branch_section_score(s1: Student, s2: Student) -> int:
    # same branch and section -> +15
    if s1.branch == s2.branch and s1.section == s2.section:
        return 15
    # same cluster -> +10
    if _same_cluster(s1.branch, s2.branch):
        return 10
    return 0

def _year_score(s1: Student, s2: Student) -> int:
    try:
        y1 = int(s1.year)
        y2 = int(s2.year)
    except:
        # if non-numeric years, treat equality only
        if s1.year == s2.year:
            return 10
        return 0
    if y1 == y2:
        return 10
    if abs(y1 - y2) == 1:
        return 5
    return 0

def _el_marks_score(s1: Student, s2: Student) -> int:
    diff = abs(s1.average_EL_marks - s2.average_EL_marks)
    if diff <= 5:
        return 8
    if diff <= 10:
        return 3
    return 0

def _hackathon_participation_score(s1: Student, s2: Student) -> int:
    diff = abs(s1.hackathon_participation_count - s2.hackathon_participation_count)
    if diff <= 2:
        return 3
    if diff <= 3:
        return 1
    return 0

ACHIEVEMENT_ORDER = {"none": 0, "participant": 1, "finalist": 2, "winner": 3}
def _hackathon_achievement_score(s1: Student, s2: Student) -> int:
    a1 = ACHIEVEMENT_ORDER.get(s1.hackathon_achievement_level, 0)
    a2 = ACHIEVEMENT_ORDER.get(s2.hackathon_achievement_level, 0)
    d = abs(a1 - a2)
    if d == 0:
        return 5
    if d == 1:
        return 3
    # opposite extremes (winner vs none)
    if (a1 == 3 and a2 == 0) or (a1 == 0 and a2 == 3):
        return 1
    return 0

# Project completion approach scoring
def _project_approach_score(s1: Student, s2: Student) -> int:
    a = s1.project_completion_approach
    b = s2.project_completion_approach
    # same-type all -> +12 (you asked to standardize to +12)
    if a == b:
        return 12
    # flexible_any_style matches anyone well -> +12 when paired with any (as per your final choice)
    if a == "flexible_any_style" or b == "flexible_any_style":
        return 12
    # cross-type scores kept as previously:
    if (a == "consistent_work" and b == "weekend_sprinter") or (b == "consistent_work" and a == "weekend_sprinter"):
        return 7
    if (a == "consistent_work" and b == "deadline_driven") or (b == "consistent_work" and a == "deadline_driven"):
        return 3
    if (a == "weekend_sprinter" and b == "deadline_driven") or (b == "weekend_sprinter" and a == "deadline_driven"):
        return 5
    return 0

# Commitment type scoring
def _commitment_type_score(s1: Student, s2: Student) -> int:
    t1 = s1.commitment_type
    t2 = s2.commitment_type
    if t1 == t2:
        return 10
    # generally_available pairings (your specific weights)
    if (t1 == "generally_available" and t2 == "technical_commitments") or (t2 == "generally_available" and t1 == "technical_commitments"):
        return 5
    if (t1 == "generally_available" and t2 == "extracurricular_commitments") or (t2 == "generally_available" and t1 == "extracurricular_commitments"):
        return 3
    if (t1 == "generally_available" and t2 == "low_commitment") or (t2 == "generally_available" and t1 == "low_commitment"):
        return 1
    # technical vs extracurricular
    if (t1 == "technical_commitments" and t2 == "extracurricular_commitments") or (t2 == "technical_commitments" and t1 == "extracurricular_commitments"):
        return 5
    # low_commitment with technical/extracurricular -> 0
    if (t1 == "low_commitment" and t2 in ("technical_commitments", "extracurricular_commitments")) or (t2 == "low_commitment" and t1 in ("technical_commitments", "extracurricular_commitments")):
        return 0
    return 0

# Residence scoring
def _residence_score(s1: Student, s2: Student) -> int:
    r1 = s1.residence
    r2 = s2.residence
    if r1 == r2:
        return 5
    if (r1 == "pg" and r2 == "hostellite") or (r2 == "pg" and r1 == "hostellite"):
        return 4
    if (r1 == "day_scholar" and r2 in ("pg", "hostellite")) or (r2 == "day_scholar" and r1 in ("pg", "hostellite")):
        return 3
    return 0

# Compute full raw rule score and return normalized (0-100)
RULE_RAW_MAX = 15 + 10 + 8 + 3 + 5 + 12 + 10 + 5  # = 68

def compute_rule_score(s1: Student, s2: Student) -> float:
    raw = 0
    raw += _branch_section_score(s1, s2)
    raw += _year_score(s1, s2)
    raw += _el_marks_score(s1, s2)
    raw += _hackathon_participation_score(s1, s2)
    raw += _hackathon_achievement_score(s1, s2)
    raw += _project_approach_score(s1, s2)
    raw += _commitment_type_score(s1, s2)
    raw += _residence_score(s1, s2)
    # normalize to 0-100
    return round((raw / RULE_RAW_MAX) * 100, 2)
