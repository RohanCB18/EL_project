from sqlalchemy import Column, Integer, Boolean, ForeignKey, DateTime
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import Base
from app.models.user import User
from app.models.classroom import Classroom
from app.models.contest_question import ContestQuestion
from app.models.contest_test_case import ContestTestCase
from app.models.contest_submission import ContestSubmission

import requests
import time

from dotenv import load_dotenv
import os

load_dotenv()

JUDGE0_URL = "https://judge0-ce.p.rapidapi.com"
JUDGE0_HEADERS = {
    "X-RapidAPI-Key": os.getenv("JUDGE0_API_KEY"),
    "X-RapidAPI-Host": os.getenv("JUDGE0_HOST"),
    "Content-Type": "application/json"
}

def run_code_judge0(source_code: str, language_id: int, input_data: str):
    payload = {
        "source_code": source_code,
        "language_id": language_id,
        "stdin": input_data
    }

    res = requests.post(
        f"{JUDGE0_URL}/submissions?base64_encoded=false&wait=false",
        headers=JUDGE0_HEADERS,
        json=payload
    )
    res.raise_for_status()

    token = res.json()["token"]

    while True:
        result = requests.get(
            f"{JUDGE0_URL}/submissions/{token}?base64_encoded=false",
            headers=JUDGE0_HEADERS
        ).json()

        if result["status"]["id"] in [1, 2]:  # In Queue / Processing
            time.sleep(0.5)
            continue

        return result


class Contest(Base):
    __tablename__ = "contests"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False
    )
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


def create_or_update_contest(db: Session, teacher_id: int, payload):
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can create contests")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )
    if not classroom:
        raise ValueError("Teacher has no active classroom")

    contest = (
        db.query(Contest)
        .filter(Contest.classroom_id == classroom.id)
        .first()
    )

    if contest and contest.is_active:
        raise ValueError("Cannot modify contest after it has started")

    if not contest:
        contest = Contest(classroom_id=classroom.id)
        db.add(contest)
        db.commit()
        db.refresh(contest)
    else:
        # rewrite old question + test cases
        db.query(ContestTestCase).filter(
            ContestTestCase.contest_question_id ==
            db.query(ContestQuestion.id)
            .filter(ContestQuestion.contest_id == contest.id)
            .scalar()
        ).delete()

        db.query(ContestQuestion).filter(
            ContestQuestion.contest_id == contest.id
        ).delete()

    question = ContestQuestion(
        contest_id=contest.id,
        title=payload.title,
        description=payload.description,
        input_format=payload.input_format,
        output_format=payload.output_format,
        constraints=payload.constraints,
        time_limit_ms=payload.time_limit_ms,
        memory_limit_kb=payload.memory_limit_kb
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    test_cases = [
        ContestTestCase(
            contest_question_id=question.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            is_sample=tc.is_sample
        )
        for tc in payload.test_cases
    ]

    db.add_all(test_cases)
    db.commit()

    return contest.id


def start_contest(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can start contests")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )
    if not classroom:
        raise ValueError("Teacher has no active classroom")

    contest = (
        db.query(Contest)
        .filter(Contest.classroom_id == classroom.id)
        .first()
    )
    if not contest:
        raise ValueError("Contest does not exist")

    if contest.is_active:
        raise ValueError("Contest already active")

    hidden_count = (
        db.query(ContestTestCase)
        .join(ContestQuestion)
        .filter(
            ContestQuestion.contest_id == contest.id,
            ContestTestCase.is_sample == False
        )
        .count()
    )

    if hidden_count == 0:
        raise ValueError("At least one hidden test case required")

    contest.is_active = True
    db.commit()

    return contest.id


def delete_contest(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can delete contests")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )
    if not classroom:
        raise ValueError("Teacher has no active classroom")

    contest = (
        db.query(Contest)
        .filter(Contest.classroom_id == classroom.id)
        .first()
    )
    if not contest:
        raise ValueError("No contest found")

    db.delete(contest)
    db.commit()

from app.models.user import User
from app.models.contest_question import ContestQuestion


def get_contest_question_for_student(db: Session, student_id: int):
    student = db.query(User).filter(User.id == student_id).first()
    if not student or student.role != "student":
        raise ValueError("Invalid student")

    if not student.current_classroom_id:
        raise ValueError("Student not in classroom")

    contest = (
        db.query(Contest)
        .filter(
            Contest.classroom_id == student.current_classroom_id,
            Contest.is_active == True
        )
        .first()
    )

    if not contest:
        raise ValueError("No active contest")

    question = (
        db.query(ContestQuestion)
        .filter(ContestQuestion.contest_id == contest.id)
        .first()
    )

    if not question:
        raise ValueError("Contest question not found")

    return question

def get_sample_test_cases_for_student(db: Session, student_id: int):
    student = db.query(User).filter(User.id == student_id).first()
    if not student or student.role != "student":
        raise ValueError("Invalid student")

    contest = (
        db.query(Contest)
        .filter(
            Contest.classroom_id == student.current_classroom_id,
            Contest.is_active == True
        )
        .first()
    )
    if not contest:
        raise ValueError("No active contest")

    question = (
        db.query(ContestQuestion)
        .filter(ContestQuestion.contest_id == contest.id)
        .first()
    )

    return (
        db.query(ContestTestCase)
        .filter(
            ContestTestCase.contest_question_id == question.id,
            ContestTestCase.is_sample == True
        )
        .all()
    )

from app.models.contest_test_case import ContestTestCase
from app.models.classroom_participant import ClassroomParticipant

def submit_contest_solution(
    db: Session,
    student_id: int,
    source_code: str,
    language_id: int
):
    # 1. Validate student
    student = db.query(User).filter(User.id == student_id).first()
    if not student or student.role != "student":
        raise ValueError("Invalid student")

    if not student.current_classroom_id:
        raise ValueError("Student not in classroom")

    # 2. Get active contest
    contest = (
        db.query(Contest)
        .filter(
            Contest.classroom_id == student.current_classroom_id,
            Contest.is_active == True
        )
        .first()
    )
    if not contest:
        raise ValueError("No active contest")

    # 3. Prevent double submission
    existing = (
        db.query(ContestSubmission)
        .filter(
            ContestSubmission.contest_id == contest.id,
            ContestSubmission.student_id == student_id
        )
        .first()
    )
    if existing:
        raise ValueError("Already submitted")

    # 4. Fetch hidden test cases
    hidden_tests = (
        db.query(ContestTestCase)
        .join(ContestQuestion)
        .filter(
            ContestQuestion.contest_id == contest.id,
            ContestTestCase.is_sample == False
        )
        .all()
    )

    if not hidden_tests:
        raise ValueError("No hidden test cases found")

    # 5. Run Judge0 on hidden tests
    score = 0

    for tc in hidden_tests:
        result = run_code_judge0(
            source_code=source_code,
            language_id=language_id,
            input_data=tc.input_data
        )

        # Accepted
        if result["status"]["id"] == 3:
            output = (result.get("stdout") or "").strip()
            expected = tc.expected_output.strip()

            if output == expected:
                score += 1

    # 6. Store submission
    submission = ContestSubmission(
        contest_id=contest.id,
        student_id=student_id,
        source_code=source_code,
        language_id=language_id,
        score=score
    )

    # 7. Update aggregate classroom score
    participant = (
        db.query(ClassroomParticipant)
        .filter(
            ClassroomParticipant.classroom_id == student.current_classroom_id,
            ClassroomParticipant.student_id == student_id
        )
        .first()
    )

    if not participant:
        raise ValueError("Student not registered in classroom")

    participant.score += score

    # 8. Atomic commit
    db.add(submission)
    db.commit()

    return score

def run_custom_test_case(
    db: Session,
    student_id: int,
    source_code: str,
    language_id: int,
    custom_input: str
):
    student = db.query(User).filter(User.id == student_id).first()
    if not student or student.role != "student":
        raise ValueError("Invalid student")

    if not student.current_classroom_id:
        raise ValueError("Student not in classroom")

    contest = (
        db.query(Contest)
        .filter(
            Contest.classroom_id == student.current_classroom_id,
            Contest.is_active == True
        )
        .first()
    )

    if not contest:
        raise ValueError("No active contest")

    # ⚠️ IMPORTANT: no DB writes, no submission checks
    result = run_code_judge0(
        source_code=source_code,
        language_id=language_id,
        input_data=custom_input
    )

    return {
        "stdout": result.get("stdout"),
        "stderr": result.get("stderr"),
        "compile_output": result.get("compile_output"),
        "status": result["status"]
    }

def deactivate_contest(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can deactivate contests")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("No active classroom")

    contest = (
        db.query(Contest)
        .filter(Contest.classroom_id == classroom.id)
        .first()
    )

    if not contest:
        raise ValueError("No contest found")

    if not contest.is_active:
        raise ValueError("Contest already inactive")

    contest.is_active = False
    db.commit()

    return contest.id

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.classroom import Classroom
from app.models.contest import Contest
from app.models.contest_submission import ContestSubmission

def get_contest_submissions_overview(db: Session, teacher_id: int):
    teacher = db.query(User).filter(User.id == teacher_id).first()

    if not teacher or teacher.role != "teacher":
        raise ValueError("Only teachers can view contest submissions")

    classroom = (
        db.query(Classroom)
        .filter(Classroom.teacher_id == teacher_id)
        .first()
    )

    if not classroom:
        raise ValueError("No active classroom")

    contest = (
        db.query(Contest)
        .filter(Contest.classroom_id == classroom.id)
        .first()
    )

    if not contest:
        raise ValueError("No contest found")

    submissions = (
        db.query(ContestSubmission, User)
        .join(User, User.id == ContestSubmission.student_id)
        .filter(ContestSubmission.contest_id == contest.id)
        .all()
    )

    return {
        "contest_id": contest.id,
        "total_submissions": len(submissions),
        "submissions": [
            {
                "student_id": user.id,
                "name": user.name,
                "email": user.email,
                "score": submission.score
            }
            for submission, user in submissions
        ]
    }
