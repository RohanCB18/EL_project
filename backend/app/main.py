from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

from app.database import engine, Base, SessionLocal
from app.models import user as user_model
from app.models import user

from app.schemas.user import UserCreate, UserResponse
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomResponse,
    ClassroomJoin,
    ClassroomStudentsResponse,
)
from app.schemas.quiz import (
    QuizCreateWithQuestions,
    QuizSubmissionCreate,
    QuizQuestionStudent,
)
from app.schemas.contest import (
    ContestCreate,
    ContestSubmissionCreate,
    ContestRunCreate,
)

from app.models.classroom import (
    create_or_get_classroom,
    join_classroom,
    leave_classroom,
    end_classroom,
    get_students_in_classroom,
    get_classroom_leaderboard,
)

from app.models.quiz import (
    create_or_update_quiz_with_questions,
    start_quiz,
    delete_quiz,
)

from app.models.quiz_question import get_active_quiz_questions_for_student
from app.models.quiz_submission import submit_quiz_and_score

from app.models.contest import (
    create_or_update_contest,
    start_contest,
    delete_contest,
    get_contest_question_for_student,
    get_sample_test_cases_for_student,
    submit_contest_solution,
    run_custom_test_case,
)

from typing import List

# --------------------------------------------------
# APP + DB
# --------------------------------------------------

app = FastAPI()
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# JWT (ADDED)
# --------------------------------------------------

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
security = HTTPBearer()

def create_access_token(data: dict, expires_minutes: int = 60):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        role = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    current_user = db.query(user.User).filter(user.User.id == user_id).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    return current_user

# --------------------------------------------------
# AUTH
# --------------------------------------------------

@app.post("/login", response_model=UserResponse)
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    user_obj = user_model.login_or_create_user(
        db=db,
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
    )

    token = create_access_token(
        {"user_id": user_obj.id, "role": user_obj.role}
    )

    return {
        "id": user_obj.id,            # still useful once, at login
        "name": user_obj.name,
        "email": user_obj.email,
        "role": user_obj.role,
        "access_token": token,
    }

# --------------------------------------------------
# CLASSROOM
# --------------------------------------------------

@app.post("/classrooms/create", response_model=ClassroomResponse)
def create_classroom_api(
    data: ClassroomCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom = create_or_get_classroom(
            db=db,
            teacher_id=current_user.id,
            room_name=data.room_name,
            password=data.password,
        )
        return {
            "id": classroom.id,
            "room_name": data.room_name,
            "room_code": classroom.room_code,
            "is_active": classroom.is_active,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classrooms/join")
def join_classroom_api(
    data: ClassroomJoin,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom = join_classroom(
            db=db,
            student_id=current_user.id,
            room_code=data.room_code,
            password=data.password,
        )
        return {
            "message": "Joined classroom successfully",
            "classroom_id": classroom.id,
            "room_code": classroom.room_code,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classrooms/leave")
def leave_classroom_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        leave_classroom(db=db, student_id=current_user.id)
        return {"message": "Left classroom successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classrooms/end")
def end_classroom_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        end_classroom(db=db, teacher_id=current_user.id)
        return {"message": "Classroom ended successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/classrooms/students", response_model=ClassroomStudentsResponse)
def list_students_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom_id, students = get_students_in_classroom(
            db=db,
            teacher_id=current_user.id,
        )
        return {
            "classroom_id": classroom_id,
            "students": [
                {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "score": score,
                }
                for u, score in students
            ],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/classrooms/leaderboard")
def classroom_leaderboard_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom_id, leaderboard = get_classroom_leaderboard(
            db=db,
            teacher_id=current_user.id,
        )
        return {
            "classroom_id": classroom_id,
            "leaderboard": leaderboard,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --------------------------------------------------
# QUIZ
# --------------------------------------------------

@app.post("/quizzes/create")
def create_quiz_api(
    data: QuizCreateWithQuestions,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        quiz_id, count = create_or_update_quiz_with_questions(
            db=db,
            teacher_id=current_user.id,
            questions=data.questions,
        )
        return {"quiz_id": quiz_id, "questions_added": count}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/quizzes/start")
def start_quiz_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        quiz_id = start_quiz(db=db, teacher_id=current_user.id)
        return {"message": "Quiz started", "quiz_id": quiz_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/quizzes/active", response_model=List[QuizQuestionStudent])
def get_active_quiz_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        _, questions = get_active_quiz_questions_for_student(
            db=db, student_id=current_user.id
        )
        return questions
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/quizzes/submit")
def submit_quiz_api(
    data: QuizSubmissionCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        score = submit_quiz_and_score(
            db=db,
            student_id=current_user.id,
            answers=data.answers,
        )
        return {"message": "Quiz submitted successfully", "score": score}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/quizzes/delete")
def delete_quiz_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        delete_quiz(db=db, teacher_id=current_user.id)
        return {"message": "Quiz deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --------------------------------------------------
# CONTEST
# --------------------------------------------------

@app.post("/contests/create")
def create_contest_api(
    data: ContestCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        contest_id = create_or_update_contest(db, current_user.id, data)
        return {"contest_id": contest_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/contests/start")
def start_contest_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        contest_id = start_contest(db, current_user.id)
        return {"contest_id": contest_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/contests/delete")
def delete_contest_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        delete_contest(db, current_user.id)
        return {"message": "Contest deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/contests/question")
def get_contest_question_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_contest_question_for_student(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/contests/sample-tests")
def get_sample_tests_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_sample_test_cases_for_student(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/contests/run")
def run_custom_test_api(
    data: ContestRunCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return run_custom_test_case(
            db=db,
            student_id=current_user.id,
            source_code=data.source_code,
            language_id=data.language_id,
            custom_input=data.input_data,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/contests/submit")
def submit_contest_api(
    data: ContestSubmissionCreate,
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        score = submit_contest_solution(
            db=db,
            student_id=current_user.id,
            source_code=data.source_code,
            language_id=data.language_id,
        )
        return {"score": score}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --------------------------------------------------
# HEALTH
# --------------------------------------------------

@app.get("/")
def health_check():
    return {"status": "Backend is running"}

from app.models.classroom import get_classroom_leaderboard_for_student

@app.get("/classrooms/leaderboard/student")
def classroom_leaderboard_student_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        classroom_id, leaderboard = get_classroom_leaderboard_for_student(
            db=db,
            student_id=current_user.id
        )

        return {
            "classroom_id": classroom_id,
            "leaderboard": leaderboard
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


from app.models.quiz import deactivate_quiz

@app.post("/quizzes/deactivate")
def deactivate_quiz_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        quiz_id = deactivate_quiz(db=db, teacher_id=current_user.id)
        return {
            "message": "Quiz deactivated successfully",
            "quiz_id": quiz_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.models.contest import deactivate_contest

@app.post("/contests/deactivate")
def deactivate_contest_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        contest_id = deactivate_contest(db=db, teacher_id=current_user.id)
        return {
            "message": "Contest deactivated successfully",
            "contest_id": contest_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


from app.models.quiz import get_quiz_submissions_overview

@app.get("/quizzes/submissions")
def quiz_submissions_overview_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = get_quiz_submissions_overview(
            db=db,
            teacher_id=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.models.contest import get_contest_submissions_overview

@app.get("/contests/submissions")
def contest_submissions_overview_api(
    current_user: user.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        result = get_contest_submissions_overview(
            db=db,
            teacher_id=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
