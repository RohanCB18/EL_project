# backend/student-matching-megha/match_engine.py
from typing import List
import numpy as np
from models import Student, Filters
from embeddings import get_embedding_for_profile
from rule_engine import compute_rule_score

# ================================================
# HELPERS: cluster mappings & expansions
# ================================================
BRANCH_CLUSTERS = {
    "CSE": "CS", "ISE": "CS", "AIML": "CS", "AIDS": "CS",
    "ECE": "EC", "EEE": "EC",
    "ME": "ME", "CV": "ME",
    # add more mappings if needed
}

DOMAIN_SYNONYMS = {
    "ai": ["ai", "artificial intelligence", "machine learning", "deep learning", "neural network", "ml"],
    "ml": ["machine learning", "ml", "deep learning", "neural network"],
    "web": ["web", "web development", "frontend", "backend", "javascript", "react", "node"],
    "iot": ["iot", "embedded", "arduino", "sensors", "raspberry"],
    "robotics": ["robotics", "robot", "mechanical", "actuator", "servo"],
    # extend synonyms for better semantic overlap
}

def _branch_cluster(branch: str) -> str:
    return BRANCH_CLUSTERS.get(branch.upper(), branch.upper())

def _expand_domains(domains: List[str]) -> List[str]:
    tokens = []
    for d in domains:
        if not d:
            continue
        d_low = d.lower()
        tokens.append(d_low)
        for key, syns in DOMAIN_SYNONYMS.items():
            if d_low in syns or key in d_low:
                tokens.extend(syns)
    # unique
    return list(dict.fromkeys(tokens))

def _jaccard(a: List[str], b: List[str]) -> float:
    set_a = set([x.lower().strip() for x in a if x])
    set_b = set([x.lower().strip() for x in b if x])
    if not set_a and not set_b:
        return 0.0
    inter = set_a.intersection(set_b)
    uni = set_a.union(set_b)
    return len(inter) / len(uni) if len(uni) > 0 else 0.0

# ================================================
# PROFILE TEXT FOR AI EMBEDDINGS (RICH, EXPANDED)
# ================================================
def build_profile_text(student: Student) -> str:
    lines = []

    # Basic demographics and academic
    lines.append(f"Name: {student.name}.")
    lines.append(f"Gender: {student.gender}.")
    lines.append(f"Branch: {student.branch}, Year: {student.year}, Section: {student.section}.")
    lines.append(f"Branch cluster: {_branch_cluster(student.branch)}.")
    lines.append(f"CGPA: {student.cgpa}.")
    lines.append(f"EL Marks: {student.average_EL_marks}.")

    # EL descriptive category (keeps existing friendly text)
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

    # Work behaviour / availability
    lines.append(f"Project completion approach: {student.project_completion_approach.replace('_', ' ')}.")
    lines.append(f"Commitment preference: {student.commitment_preference.replace('_', ' ')}.")
    lines.append(f"Residence: {student.residence.replace('_', ' ')}.")

    # Programming languages & tech skills
    if student.programming_languages:
        lines.append("Programming languages: " + ", ".join(student.programming_languages) + ".")
    if student.tech_skills:
        lines.append("Technical skills: " + ", ".join(student.tech_skills) + ".")

    # Domain interests (with expansion)
    if student.domain_interests:
        expanded = _expand_domains(student.domain_interests)
        lines.append("Domain interests: " + ", ".join(student.domain_interests) + ".")
        # also add expanded tokens so embedding picks up semantic similarity between nearby domains
        lines.append("Related domain keywords: " + ", ".join(expanded) + ".")

    # Past projects (concise but descriptive)
    if student.past_projects:
        proj_lines = []
        for p in student.past_projects:
            title = (p.title or "").strip()
            desc = (p.description or "").strip()
            proj_lines.append(f"{title} - {desc}")
        lines.append("Past projects: " + " ; ".join(proj_lines) + ".")

    # Hackathon experience
    lines.append(
        f"Hackathon participation: {student.hackathon_participation_count}, achievement: {student.hackathon_achievement_level}."
    )

    # a final short 'keywords' summary to reinforce main signals the model should use
    keyword_parts = []
    if student.branch:
        keyword_parts.append(student.branch)
        keyword_parts.append(_branch_cluster(student.branch))
    keyword_parts.extend(student.domain_interests)
    keyword_parts.extend(student.programming_languages)
    keyword_parts.extend(student.tech_skills)
    keyword_parts.append(str(student.cgpa))
    keyword_parts.append(str(student.average_EL_marks))
    lines.append("Profile keywords: " + ", ".join([k for k in keyword_parts if k]) + ".")

    return "\n".join(lines)

# ================================================
# SEMANTIC SIMILARITY (with small overlap bonuses)
# ================================================
def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    if a is None or b is None:
        return 0.0
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

def compute_semantic_score(profile_i_vec: np.ndarray, profile_j_vec: np.ndarray,
                           s1: Student = None, s2: Student = None) -> float:
    """
    Computes semantic similarity (0-100) from embeddings, then applies a SMALL bonus
    based on:
      - programming/tech skill overlap (Jaccard)
      - domain interest overlap (Jaccard with domain expansion)
      - branch cluster similarity (same branch = +5, same cluster = +8)
    Bonus is intentionally modest (max ~15-20 points) so it doesn't completely override
    the rule-based component but helps similar-minded pairs rise in semantic score.
    """
    sim = _cosine_sim(profile_i_vec, profile_j_vec)  # -1..1
    base = ((sim + 1.0) / 2.0) * 100.0  # to 0..100

    # If student objects provided, compute extra semantic bonuses:
    bonus = 0.0
    try:
        if s1 and s2:
            # skill overlap
            skills_a = [k.lower() for k in (s1.tech_skills or [])]
            skills_b = [k.lower() for k in (s2.tech_skills or [])]
            skill_j = _jaccard(skills_a, skills_b)
            # give a scaled contribution (0..6)
            bonus += skill_j * 6.0

            # programming languages overlap
            langs_a = [k.lower() for k in (s1.programming_languages or [])]
            langs_b = [k.lower() for k in (s2.programming_languages or [])]
            lang_j = _jaccard(langs_a, langs_b)
            bonus += lang_j * 3.0

            # domain interests overlap using expanded tokens
            dom_a = _expand_domains(s1.domain_interests or [])
            dom_b = _expand_domains(s2.domain_interests or [])
            dom_j = _jaccard(dom_a, dom_b)
            bonus += dom_j * 6.0

            # branch/cluster similarity
            if s1.branch and s2.branch:
                if s1.branch == s2.branch:
                    bonus += 5.0
                elif _branch_cluster(s1.branch) == _branch_cluster(s2.branch):
                    bonus += 3.0

            # small boost for close EL marks
            el_diff = abs((s1.average_EL_marks or 0) - (s2.average_EL_marks or 0))
            if el_diff <= 5:
                bonus += 2.0
            elif el_diff <= 10:
                bonus += 1.0

    except Exception:
        # be tolerant — don't let bonus computation crash matching
        bonus = 0.0

    # cap bonus reasonably
    if bonus > 18.0:
        bonus = 18.0

    final = base + bonus
    if final > 100.0:
        final = 100.0

    return round(final, 2)

# ================================================
# FILTERING LOGIC
# ================================================
def apply_filters_pool(students: List[Student], filters: Filters) -> List[Student]:
    pool = students

    if filters is None:
        return pool

    # same branch filter
    if getattr(filters, "same_branch_only", None):
        pool = [s for s in pool if s.branch == students[0].branch]

    # same year filter
    if getattr(filters, "same_year_only", None):
        pool = [s for s in pool if s.year == students[0].year]

    # same-gender filter
    if getattr(filters, "same_gender_only", None):
        pool = [s for s in pool if s.gender == students[0].gender]

    # optional: min_score & top_k are applied after matching
    return pool

# ================================================
# HYBRID MATCH ENGINE
# ================================================
def match_students_hybrid(
    students: List[Student],
    filters: Filters = None,
    semantic_weight: float = 0.4,
    rule_weight: float = 0.6
):
    if filters is None:
        filters = Filters()

    # Apply pool-level filters
    pool = apply_filters_pool(students, filters)

    # safety: nothing to match
    if len(pool) < 2:
        return {"matches": []}

    # Precompute embeddings
    embeddings = {}
    for s in pool:
        text = build_profile_text(s)
        vec = get_embedding_for_profile(text, s.usn)
        embeddings[s.usn] = vec

    matches = []
    n = len(pool)

    for i in range(n):
        for j in range(i + 1, n):
            s1 = pool[i]
            s2 = pool[j]

            # Rule-based score
            rule_score = compute_rule_score(s1, s2)

            # Semantic score (pass students to get bonus)
            semantic_score = compute_semantic_score(
                embeddings[s1.usn],
                embeddings[s2.usn],
                s1=s1,
                s2=s2
            )

            # Hybrid score
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

    # Apply score filters if needed
    if getattr(filters, "min_score", None):
        matches = [m for m in matches if m["final_score"] >= filters.min_score]

    matches.sort(key=lambda x: x["final_score"], reverse=True)

    if getattr(filters, "top_k", None):
        matches = matches[:filters.top_k]

    return {"matches": matches}
