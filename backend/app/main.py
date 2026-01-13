from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models import user as user_model
from app.schemas.user import UserCreate, UserResponse
from app.models import user
from app.models import classroom
from app.models import classroom_participant
from app.models import quiz
from app.models import quiz_question
from app.models import quiz_submission



app = FastAPI()

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/login", response_model=UserResponse)
def login(user: UserCreate, db: Session = Depends(get_db)):
    try:
        return user_model.login_or_create_user(
            db=db,
            name=user.name,
            email=user.email,
            role=user.role
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


from app.schemas.classroom import ClassroomCreate, ClassroomResponse
from app.models.classroom import create_or_get_classroom

@app.post("/classrooms/create", response_model=ClassroomResponse)
def create_classroom(
    data: ClassroomCreate,
    teacher_id: int,
    db: Session = Depends(get_db)
):
    try:
        classroom = create_or_get_classroom(
            db=db,
            teacher_id=teacher_id,
            room_name=data.room_name,
            password=data.password
        )

        return {
            "id": classroom.id,
            "room_name": data.room_name,
            "room_code": classroom.room_code,
            "is_active": classroom.is_active
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.schemas.classroom import ClassroomJoin
from app.models.classroom import join_classroom, leave_classroom, end_classroom

@app.post("/classrooms/join")
def join_classroom_api(
    data: ClassroomJoin,
    db: Session = Depends(get_db)
):
    try:
        classroom = join_classroom(
            db=db,
            student_id=data.student_id,
            room_code=data.room_code,
            password=data.password
        )

        return {
            "message": "Joined classroom successfully",
            "classroom_id": classroom.id,
            "room_code": classroom.room_code
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classrooms/leave")
def leave_classroom_api(
    student_id: int,
    db: Session = Depends(get_db)
):
    try:
        leave_classroom(db=db, student_id=student_id)
        return {"message": "Left classroom successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/classrooms/end")
def end_classroom_api(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    try:
        end_classroom(db=db, teacher_id=teacher_id)
        return {"message": "Classroom ended successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.schemas.classroom import ClassroomStudentsResponse
from app.models.classroom import get_students_in_classroom

@app.get("/classrooms/students", response_model=ClassroomStudentsResponse)
def list_students(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    try:
        classroom_id, students = get_students_in_classroom(
            db=db,
            teacher_id=teacher_id
        )

        return {
            "classroom_id": classroom_id,
            "students": [
                {
                    "id": s.id,
                    "name": s.name,
                    "email": s.email
                }
                for s in students
            ]
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.schemas.quiz import QuizCreateWithQuestions
from app.models.quiz import create_or_update_quiz_with_questions

@app.post("/quizzes/create")
def create_quiz_with_questions(
    data: QuizCreateWithQuestions,
    db: Session = Depends(get_db)
):
    try:
        quiz_id, count = create_or_update_quiz_with_questions(
            db=db,
            teacher_id=data.teacher_id,
            questions=data.questions
        )

        return {
            "quiz_id": quiz_id,
            "questions_added": count
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.schemas.quiz import QuizSubmissionCreate
from app.models.quiz_submission import submit_quiz_and_score

from app.models.quiz import start_quiz
from app.models.quiz_question import get_active_quiz_questions_for_student
from app.schemas.quiz import QuizQuestionStudent
from typing import List

@app.post("/quizzes/start")
def start_quiz_api(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    try:
        quiz_id = start_quiz(db=db, teacher_id=teacher_id)
        return {"message": "Quiz started", "quiz_id": quiz_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get(
    "/quizzes/active",
    response_model=List[QuizQuestionStudent]
)
def get_active_quiz_for_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    try:
        quiz_id, questions = get_active_quiz_questions_for_student(
            db=db,
            student_id=student_id
        )
        return questions
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/quizzes/submit")
def submit_quiz_api(
    data: QuizSubmissionCreate,
    db: Session = Depends(get_db)
):
    try:
        score = submit_quiz_and_score(
            db=db,
            student_id=data.student_id,
            answers=data.answers
        )

        return {
            "message": "Quiz submitted successfully",
            "score": score
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/")
def health_check():
    return {"status": "Backend is running"}

from app.models.quiz import delete_quiz

@app.delete("/quizzes/delete")
def delete_quiz_api(
    teacher_id: int,
    db: Session = Depends(get_db)
):
    try:
        delete_quiz(db=db, teacher_id=teacher_id)
        return {"message": "Quiz deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
