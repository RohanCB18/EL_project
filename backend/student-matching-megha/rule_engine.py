from models import Student

# ============================
# RAW SCORE MAXIMUM (sum of all rule components)
# ============================

RULE_RAW_MAX = (
    15  # same section
    + 10  # same / similar branch cluster
    + 8   # EL marks diff <= 5
    + 3   # EL marks diff <= 10
    + 5   # hackathon achievement
    + 12  # project completion approach
    + 10  # commitment preference
    + 5   # residence
    + 4   # gender match
)  # TOTAL = 72


# ============================
# INDIVIDUAL RULE FUNCTIONS
# ============================

def _branch_section_score(a: Student, b: Student) -> int:
    """Same branch + same section (highest), same branch (medium), same cluster (low)."""
    
    # Same branch AND same section → +15
    if a.branch == b.branch and a.section == b.section:
        return 15
    
    # Same branch but different section → +12
    if a.branch == b.branch:
        return 12

    # Cluster-based similarity → +10
    branch_clusters = {
        "CSE": "CS", "ISE": "CS", "AIML": "CS", "CY": "CS",
        "ECE": "EC", "EEE": "EC", "ETE": "EC",
        "ME": "ME", "CV": "ME", "CH": "ME",
    }
    if branch_clusters.get(a.branch) == branch_clusters.get(b.branch):
        return 10

    return 0


def _year_score(a: Student, b: Student) -> int:
    return 12 if a.year == b.year else 0


def _el_marks_score(a: Student, b: Student) -> int:
    diff = abs(a.average_EL_marks - b.average_EL_marks)
    if diff <= 5:
        return 8
    if diff <= 10:
        return 3
    return 0


def _hackathon_participation_score(a: Student, b: Student) -> int:
    diff = abs(a.hackathon_participation_count - b.hackathon_participation_count)
    if diff <= 2:
        return 3
    if diff <= 3:
        return 1
    return 0


def _hackathon_achievement_score(a: Student, b: Student) -> int:
    level_order = {"none": 0, "participant": 1, "finalist": 2, "winner": 3}
    diff = abs(level_order[a.hackathon_achievement_level] - level_order[b.hackathon_achievement_level])

    if diff == 0:
        return 5
    if diff == 1:
        return 3
    if diff == 3:  # winner vs none
        return 1
    return 0


def _project_approach_score(a: Student, b: Student) -> int:
    if a.project_completion_approach == b.project_completion_approach:
        return 12
    return 0


def _commitment_type_score(a: Student, b: Student) -> int:
    pairs = {
        "generally_available": 3,
        "extracurricular_commitments": 2,
        "technical_commitments": 2,
        "low_commitment": 1,
    }

    if a.commitment_preference == b.commitment_preference:
        return 10
    
    # If one person is "generally_available" they can work well with anyone → partial score
    if a.commitment_preference == "generally_available" or b.commitment_preference == "generally_available":
        return pairs[b.commitment_preference] if a.commitment_preference == "generally_available" else pairs[a.commitment_preference]

    return 0


def _residence_score(a: Student, b: Student) -> int:
    if a.residence == b.residence:
        return 5
    if (a.residence, b.residence) in [("pg", "hostellite"), ("hostellite", "pg")]:
        return 4
    if (a.residence == "day_scholar" and b.residence != "day_scholar") or \
       (b.residence == "day_scholar" and a.residence != "day_scholar"):
        return 3
    return 0


def _gender_score(a: Student, b: Student) -> int:
    return 4 if a.gender == b.gender else 0


# ============================
# FINAL RULE SCORE
# ============================

def compute_rule_score(a: Student, b: Student) -> float:
    raw = 0
    raw += _branch_section_score(a, b)
    raw += _year_score(a, b)
    raw += _el_marks_score(a, b)
    raw += _hackathon_participation_score(a, b)
    raw += _hackathon_achievement_score(a, b)
    raw += _project_approach_score(a, b)
    raw += _commitment_type_score(a, b)
    raw += _residence_score(a, b)
    raw += _gender_score(a, b)

    # Normalize to 0–100
    return round((raw / RULE_RAW_MAX) * 100, 2)
