"""
FastAPI Routes for Quiz Proctoring System
Wraps existing logic from test_gaze_detection.py
"""
from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional, List, Dict
import numpy as np
import cv2
import uuid
from datetime import datetime
import base64
import json
import os

# Import existing proctoring functions
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from test_gaze_detection import start_session, end_session, process_frame
from database.models import (
    ProctorSession, CheatingEvent, get_db_session,
    Student, Teacher, Quiz, QuizQuestion, StudentAttempt, StudentAnswer
)
from utils.evidence_manager import EvidenceManager

# Initialize evidence manager
evidence_manager = EvidenceManager()

# Create router
router = APIRouter(prefix="/proctor", tags=["proctoring"])


# Request/Response models
class StartSessionRequest(BaseModel):
    student_id: str
    quiz_id: str


class StartSessionResponse(BaseModel):
    session_id: str
    message: str


class FrameRequest(BaseModel):
    session_id: str
    frame_base64: str  # Base64 encoded JPEG/PNG


class FrameResponse(BaseModel):
    event: str  # "NORMAL", "SUSPICIOUS", "CHEATING", "CALIBRATING"
    confidence: float
    reason: str
    annotated_frame_base64: Optional[str] = None


class EndSessionRequest(BaseModel):
    session_id: str


class EndSessionResponse(BaseModel):
    session_id: str
    student_id: str
    quiz_id: str
    start_time: str
    end_time: str
    total_frames: int
    total_events: int
    suspicious_events: int
    cheating_events: int


class EvidenceItem(BaseModel):
    confidence: float
    reason: str
    event_type: str
    timestamp: str
    image_base64: str


class EvidenceResponse(BaseModel):
    session_id: str
    total_evidences: int
    evidences: List[EvidenceItem]


class BrowserEventRequest(BaseModel):
    session_id: str
    event: str  # "EXIT_FULLSCREEN", "TAB_SWITCH", "WINDOW_BLUR"
    severity: str  # "HIGH"
    timestamp: str


class HeartbeatRequest(BaseModel):
    session_id: str
    timestamp: str


# Endpoints
@router.post("/start-session", response_model=StartSessionResponse)
async def start_proctoring_session(request: StartSessionRequest):
    """
    Start a new proctoring session.
    
    Creates a session in the database and initializes the CV pipeline.
    """
    try:
        # Start session using existing function
        session_id = start_session(request.student_id, request.quiz_id)
        
        # Save to database
        db = get_db_session()
        db_session = ProctorSession(
            session_id=session_id,
            student_id=request.student_id,
            quiz_id=request.quiz_id,
            start_time=datetime.utcnow()
        )
        db.add(db_session)
        db.commit()
        db.close()
        
        return StartSessionResponse(
            session_id=session_id,
            message="Proctoring session started successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")


@router.post("/frame", response_model=FrameResponse)
async def process_proctoring_frame(request: FrameRequest):
    """
    Process a single frame from the webcam.
    
    Runs gaze detection and object detection, returns event classification.
    """
    try:
        # Decode base64 frame
        frame_bytes = base64.b64decode(request.frame_base64)
        frame_array = np.frombuffer(frame_bytes, dtype=np.uint8)
        frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid frame data")
        
        # Process using existing function
        result = process_frame(request.session_id, frame)
        
        # Save evidence if high confidence
        if result["event"] in ["SUSPICIOUS", "CHEATING"]:
            event_type = "GAZE_AVERSION" if "gaze" in result["reason"].lower() else "FORBIDDEN_OBJECT"
            
            saved_path = evidence_manager.add_evidence(
                session_id=request.session_id,
                frame=result["annotated_frame"],
                confidence=result["confidence"],
                reason=result["reason"],
                event_type=event_type
            )
            
            # Save to database if evidence was stored
            if saved_path and result["confidence"] >= 0.8:
                db = get_db_session()
                event_id = str(uuid.uuid4())
                db_event = CheatingEvent(
                    id=event_id,
                    session_id=request.session_id,
                    event_type=event_type,
                    reason=result["reason"],
                    confidence=result["confidence"],
                    image_path=saved_path,
                    timestamp=datetime.utcnow()
                )
                db.add(db_event)
                db.commit()
                db.close()
        
        # Encode annotated frame to base64 (optional, for debugging)
        _, buffer = cv2.imencode('.jpg', result["annotated_frame"])
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return FrameResponse(
            event=result["event"],
            confidence=result["confidence"],
            reason=result["reason"],
            annotated_frame_base64=annotated_base64
        )
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process frame: {str(e)}")


@router.post("/end-session", response_model=EndSessionResponse)
async def end_proctoring_session(request: EndSessionRequest):
    """
    End a proctoring session.
    
    Cleans up resources and returns session summary.
    """
    try:
        # End session using existing function
        summary = end_session(request.session_id)
        
        # Update database
        db = get_db_session()
        db_session = db.query(ProctorSession).filter_by(session_id=request.session_id).first()
        
        if db_session:
            db_session.end_time = datetime.utcnow()
            db.commit()
        
        db.close()
        
        return EndSessionResponse(**summary)
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")


@router.get("/evidence/{session_id}", response_model=EvidenceResponse)
async def get_session_evidence(session_id: str):
    """
    Get Top-K strongest evidences for a session.
    
    Returns screenshots sorted by confidence (highest first) PLUS browser events.
    """
    try:
        # Get evidences from evidence manager (visual evidence with screenshots)
        evidences = evidence_manager.get_evidences(session_id)
        
        # Convert to response format with base64 images
        evidence_items = []
        for ev in evidences:
            # Read image and encode to base64
            if os.path.exists(ev['path']):
                with open(ev['path'], 'rb') as f:
                    image_bytes = f.read()
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                
                evidence_items.append(EvidenceItem(
                    confidence=ev['confidence'],
                    reason=ev['reason'],
                    event_type=ev['event_type'],
                    timestamp=ev['timestamp'],
                    image_base64=image_base64
                ))
        
        # Also fetch browser events from database (no screenshots)
        db = get_db_session()
        browser_events = db.query(CheatingEvent).filter_by(session_id=session_id).filter(
            CheatingEvent.event_type.in_(['EXIT_FULLSCREEN', 'TAB_SWITCH', 'WINDOW_BLUR'])
        ).order_by(CheatingEvent.timestamp.desc()).all()
        
        for event in browser_events:
            evidence_items.append(EvidenceItem(
                confidence=event.confidence,
                reason=event.reason,
                event_type=event.event_type,
                timestamp=event.timestamp.isoformat() + 'Z',
                image_base64=''  # No image for browser events
            ))
        
        db.close()
        
        # Sort all evidence by confidence descending
        evidence_items.sort(key=lambda x: x.confidence, reverse=True)
        
        return EvidenceResponse(
            session_id=session_id,
            total_evidences=len(evidence_items),
            evidences=evidence_items
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve evidence: {str(e)}")


@router.post("/browser-event")
async def log_browser_event(request: BrowserEventRequest):
    """
    Log browser security events (fullscreen exit, tab switch, window blur).
    
    These are HIGH severity events indicating potential cheating.
    """
    try:
        # Save to database as cheating event
        db = get_db_session()
        event_id = str(uuid.uuid4())
        
        db_event = CheatingEvent(
            id=event_id,
            session_id=request.session_id,
            event_type=request.event,
            reason=f"Browser security violation: {request.event}",
            confidence=1.0,  # Browser events are definitive
            image_path=None,  # No screenshot for browser events
            timestamp=datetime.fromisoformat(request.timestamp.replace('Z', '+00:00'))
        )
        db.add(db_event)
        db.commit()
        db.close()
        
        return {"status": "logged", "event": request.event, "severity": request.severity}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log browser event: {str(e)}")


@router.post("/heartbeat")
async def receive_heartbeat(request: HeartbeatRequest):
    """
    Receive heartbeat from client to detect tampering.
    
    If heartbeats stop unexpectedly, it indicates possible JS disablement or tampering.
    Backend tracks last heartbeat time per session.
    """
    try:
        # Update session last heartbeat time
        db = get_db_session()
        db_session = db.query(ProctorSession).filter_by(session_id=request.session_id).first()
        
        if db_session:
            # Store heartbeat timestamp in session (you may want to add a column for this)
            # For now, we just acknowledge receipt
            pass
        
        db.close()
        
        return {"status": "ok", "timestamp": request.timestamp}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process heartbeat: {str(e)}")


# Health check
@router.get("/health")
async def health_check():
    """Check if the proctoring service is running."""
    return {"status": "ok", "message": "Proctoring service is running"}


# ============================================================================
# AUTHENTICATION & QUIZ MANAGEMENT ENDPOINTS
# ============================================================================
# These are separate routers that should be included directly in main app

# Authentication Models
class StudentRegisterRequest(BaseModel):
    email: str
    password: str


class TeacherRegisterRequest(BaseModel):
    email: str
    password: str
    subject: str  # 'adld', 'dsa', or 'os'


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict] = None


# Quiz Models
class QuestionData(BaseModel):
    question: str
    options: List[str]
    answer: str
    is_custom: bool = False


class CreateQuizRequest(BaseModel):
    title: str
    subject: str
    questions: List[QuestionData]


class QuizResponse(BaseModel):
    quiz_id: str
    title: str
    subject: str
    time_limit: int
    question_count: int
    created_at: str


class QuizDetailResponse(BaseModel):
    quiz_id: str
    title: str
    subject: str
    time_limit: int
    questions: List[Dict]


class StartAttemptRequest(BaseModel):
    student_email: str
    quiz_id: str


class StartAttemptResponse(BaseModel):
    attempt_id: str
    session_id: str
    quiz: QuizDetailResponse


class SubmitAnswerRequest(BaseModel):
    attempt_id: str
    question_id: int
    selected_answer: str


class SubmitQuizRequest(BaseModel):
    attempt_id: str
    answers: List[Dict]  # [{"question_id": int, "selected_answer": str}]
    auto_submitted: bool = False


class QuizResultResponse(BaseModel):
    attempt_id: str
    score: float
    total_questions: int
    correct_answers: int
    answers: List[Dict]


class StudentAttemptSummary(BaseModel):
    student_email: str
    attempt_id: str
    score: float
    start_time: str
    end_time: str
    auto_submitted: bool
    violations: List[Dict]


# Authentication Endpoints
auth_router = APIRouter(prefix="/auth", tags=["authentication"])


@auth_router.post("/student/register", response_model=AuthResponse)
async def register_student(request: StudentRegisterRequest):
    """Register a new student."""
    try:
        db = get_db_session()
        
        # Check if email already exists
        existing = db.query(Student).filter_by(email=request.email).first()
        if existing:
            db.close()
            return AuthResponse(success=False, message="Email already registered")
        
        # Create new student
        student = Student(
            email=request.email,
            password_hash=Student.hash_password(request.password)
        )
        db.add(student)
        db.commit()
        db.close()
        
        return AuthResponse(
            success=True,
            message="Registration successful",
            user={"email": request.email, "role": "student"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@auth_router.post("/student/login", response_model=AuthResponse)
async def login_student(request: LoginRequest):
    """Login a student."""
    try:
        db = get_db_session()
        student = db.query(Student).filter_by(email=request.email).first()
        db.close()
        
        if not student or not student.verify_password(request.password):
            return AuthResponse(success=False, message="Invalid email or password")
        
        return AuthResponse(
            success=True,
            message="Login successful",
            user={"email": student.email, "role": "student"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@auth_router.post("/teacher/register", response_model=AuthResponse)
async def register_teacher(request: TeacherRegisterRequest):
    """Register a new teacher."""
    try:
        # Validate subject
        if request.subject not in ['adld', 'dsa', 'os']:
            return AuthResponse(success=False, message="Invalid subject. Must be: adld, dsa, or os")
        
        db = get_db_session()
        
        # Check if email already exists
        existing = db.query(Teacher).filter_by(email=request.email).first()
        if existing:
            db.close()
            return AuthResponse(success=False, message="Email already registered")
        
        # Create new teacher
        teacher = Teacher(
            email=request.email,
            password_hash=Teacher.hash_password(request.password),
            subject=request.subject
        )
        db.add(teacher)
        db.commit()
        db.close()
        
        return AuthResponse(
            success=True,
            message="Registration successful",
            user={"email": request.email, "role": "teacher", "subject": request.subject}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@auth_router.post("/teacher/login", response_model=AuthResponse)
async def login_teacher(request: LoginRequest):
    """Login a teacher."""
    try:
        db = get_db_session()
        teacher = db.query(Teacher).filter_by(email=request.email).first()
        db.close()
        
        if not teacher or not teacher.verify_password(request.password):
            return AuthResponse(success=False, message="Invalid email or password")
        
        return AuthResponse(
            success=True,
            message="Login successful",
            user={"email": teacher.email, "role": "teacher", "subject": teacher.subject}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


# Quiz Management Endpoints
quiz_router = APIRouter(prefix="/quiz", tags=["quiz"])


@quiz_router.get("/questions/{subject}")
async def get_subject_questions(subject: str):
    """Get all questions from the subject JSON file."""
    try:
        if subject not in ['adld', 'dsa', 'os']:
            raise HTTPException(status_code=400, detail="Invalid subject")
        
        # Read JSON file from root
        json_path = f"{subject}.json"
        if not os.path.exists(json_path):
            raise HTTPException(status_code=404, detail="Question bank not found")
        
        with open(json_path, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        return {"subject": subject, "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load questions: {str(e)}")


@quiz_router.post("/create", response_model=QuizResponse)
async def create_quiz(request: CreateQuizRequest, teacher_email: str):
    """Create a new quiz."""
    try:
        db = get_db_session()
        
        # Verify teacher exists and subject matches
        teacher = db.query(Teacher).filter_by(email=teacher_email).first()
        if not teacher:
            db.close()
            raise HTTPException(status_code=403, detail="Teacher not found")
        
        if teacher.subject != request.subject:
            db.close()
            raise HTTPException(status_code=403, detail="Teacher can only create quizzes for their subject")
        
        # Create quiz
        quiz_id = str(uuid.uuid4())
        time_limit = len(request.questions) * 120  # 2 minutes per question
        
        quiz = Quiz(
            quiz_id=quiz_id,
            teacher_email=teacher_email,
            subject=request.subject,
            title=request.title,
            time_limit=time_limit
        )
        db.add(quiz)
        
        # Add questions
        for idx, q in enumerate(request.questions):
            # Determine correct answer format
            if len(q.options) == 4:
                # Find which option matches the answer
                correct_ans = q.answer
                if q.answer in q.options:
                    correct_ans = chr(65 + q.options.index(q.answer))  # A, B, C, D
            else:
                correct_ans = q.answer
            
            question = QuizQuestion(
                quiz_id=quiz_id,
                question_order=idx,
                question_text=q.question,
                option_a=q.options[0] if len(q.options) > 0 else "",
                option_b=q.options[1] if len(q.options) > 1 else "",
                option_c=q.options[2] if len(q.options) > 2 else "",
                option_d=q.options[3] if len(q.options) > 3 else "",
                correct_answer=correct_ans,
                is_custom=q.is_custom
            )
            db.add(question)
        
        db.commit()
        db.close()
        
        return QuizResponse(
            quiz_id=quiz_id,
            title=request.title,
            subject=request.subject,
            time_limit=time_limit,
            question_count=len(request.questions),
            created_at=datetime.utcnow().isoformat() + 'Z'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create quiz: {str(e)}")


@quiz_router.get("/list")
async def list_quizzes(student_email: Optional[str] = None):
    """List all quizzes. If student_email provided, include attempt status."""
    try:
        db = get_db_session()
        quizzes = db.query(Quiz).order_by(Quiz.created_at.desc()).all()
        
        result = []
        for quiz in quizzes:
            quiz_data = {
                "quiz_id": quiz.quiz_id,
                "title": quiz.title,
                "subject": quiz.subject,
                "teacher_email": quiz.teacher_email,
                "time_limit": quiz.time_limit,
                "question_count": len(quiz.questions),
                "created_at": quiz.created_at.isoformat() + 'Z',
                "attempted": False
            }
            
            # Check if student has attempted
            if student_email:
                attempt = db.query(StudentAttempt).filter_by(
                    student_email=student_email,
                    quiz_id=quiz.quiz_id
                ).first()
                quiz_data["attempted"] = attempt is not None
            
            result.append(quiz_data)
        
        db.close()
        return {"quizzes": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list quizzes: {str(e)}")


@quiz_router.get("/{quiz_id}", response_model=QuizDetailResponse)
async def get_quiz_details(quiz_id: str):
    """Get quiz details with questions."""
    try:
        db = get_db_session()
        quiz = db.query(Quiz).filter_by(quiz_id=quiz_id).first()
        
        if not quiz:
            db.close()
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        questions = []
        for q in quiz.questions:
            questions.append({
                "id": q.id,
                "question": q.question_text,
                "options": [q.option_a, q.option_b, q.option_c, q.option_d],
                "is_custom": q.is_custom
            })
        
        db.close()
        
        return QuizDetailResponse(
            quiz_id=quiz.quiz_id,
            title=quiz.title,
            subject=quiz.subject,
            time_limit=quiz.time_limit,
            questions=questions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quiz: {str(e)}")


@quiz_router.post("/start-attempt", response_model=StartAttemptResponse)
async def start_quiz_attempt(request: StartAttemptRequest):
    """Start a quiz attempt and proctoring session."""
    try:
        db = get_db_session()
        
        # Check if already attempted
        existing = db.query(StudentAttempt).filter_by(
            student_email=request.student_email,
            quiz_id=request.quiz_id
        ).first()
        
        if existing:
            db.close()
            raise HTTPException(status_code=400, detail="Quiz already attempted")
        
        # Get quiz details
        quiz = db.query(Quiz).filter_by(quiz_id=request.quiz_id).first()
        if not quiz:
            db.close()
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Start proctoring session
        session_id = start_session(request.student_email, request.quiz_id)
        
        # Create proctoring session in DB
        proctor_session = ProctorSession(
            session_id=session_id,
            student_id=request.student_email,
            quiz_id=request.quiz_id,
            start_time=datetime.utcnow()
        )
        db.add(proctor_session)
        
        # Create attempt
        attempt_id = str(uuid.uuid4())
        attempt = StudentAttempt(
            attempt_id=attempt_id,
            student_email=request.student_email,
            quiz_id=request.quiz_id,
            session_id=session_id,
            start_time=datetime.utcnow()
        )
        db.add(attempt)
        db.commit()
        
        # Get quiz details for response
        questions = []
        for q in quiz.questions:
            questions.append({
                "id": q.id,
                "question": q.question_text,
                "options": [q.option_a, q.option_b, q.option_c, q.option_d],
                "is_custom": q.is_custom
            })
        
        db.close()
        
        return StartAttemptResponse(
            attempt_id=attempt_id,
            session_id=session_id,
            quiz=QuizDetailResponse(
                quiz_id=quiz.quiz_id,
                title=quiz.title,
                subject=quiz.subject,
                time_limit=quiz.time_limit,
                questions=questions
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start attempt: {str(e)}")


@quiz_router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(request: SubmitQuizRequest):
    """Submit quiz and calculate score."""
    try:
        db = get_db_session()
        
        # Get attempt
        attempt = db.query(StudentAttempt).filter_by(attempt_id=request.attempt_id).first()
        if not attempt:
            db.close()
            raise HTTPException(status_code=404, detail="Attempt not found")
        
        if attempt.submitted:
            db.close()
            raise HTTPException(status_code=400, detail="Quiz already submitted")
        
        # Get quiz questions
        quiz = db.query(Quiz).filter_by(quiz_id=attempt.quiz_id).first()
        questions = {q.id: q for q in quiz.questions}
        
        # Save answers and calculate score
        correct_count = 0
        total_count = len(questions)
        answer_details = []
        
        for ans in request.answers:
            question = questions.get(ans["question_id"])
            if not question:
                continue
            
            # Determine if correct
            selected = ans["selected_answer"]
            is_correct = False
            
            # Check if answer matches (handle both letter format and text format)
            if selected == question.correct_answer:
                is_correct = True
            elif selected in ['A', 'B', 'C', 'D']:
                # Convert letter to option text
                options = [question.option_a, question.option_b, question.option_c, question.option_d]
                option_text = options[ord(selected) - 65]
                if option_text == question.correct_answer:
                    is_correct = True
            
            if is_correct:
                correct_count += 1
            
            # Save answer
            student_answer = StudentAnswer(
                attempt_id=request.attempt_id,
                question_id=ans["question_id"],
                selected_answer=selected,
                is_correct=is_correct
            )
            db.add(student_answer)
            
            # Prepare response data
            answer_details.append({
                "question_id": ans["question_id"],
                "question": question.question_text,
                "options": [question.option_a, question.option_b, question.option_c, question.option_d],
                "selected_answer": selected,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct
            })
        
        # Calculate score
        score = (correct_count / total_count * 100) if total_count > 0 else 0
        
        # Update attempt
        attempt.end_time = datetime.utcnow()
        attempt.score = score
        attempt.submitted = True
        attempt.auto_submitted = request.auto_submitted
        
        # End proctoring session
        if attempt.session_id:
            try:
                end_session(attempt.session_id)
                proctor_session = db.query(ProctorSession).filter_by(session_id=attempt.session_id).first()
                if proctor_session:
                    proctor_session.end_time = datetime.utcnow()
            except:
                pass  # Session might already be ended
        
        db.commit()
        db.close()
        
        return QuizResultResponse(
            attempt_id=request.attempt_id,
            score=score,
            total_questions=total_count,
            correct_answers=correct_count,
            answers=answer_details
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {str(e)}")


@quiz_router.get("/{quiz_id}/attempts")
async def get_quiz_attempts(quiz_id: str, teacher_email: str):
    """Get all student attempts for a quiz (teacher only)."""
    try:
        db = get_db_session()
        
        # Verify teacher owns this quiz
        quiz = db.query(Quiz).filter_by(quiz_id=quiz_id).first()
        if not quiz:
            db.close()
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        if quiz.teacher_email != teacher_email:
            db.close()
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Get all attempts
        attempts = db.query(StudentAttempt).filter_by(quiz_id=quiz_id, submitted=True).all()
        
        results = []
        for attempt in attempts:
            # Get violations
            violations = []
            if attempt.session_id:
                events = db.query(CheatingEvent).filter_by(session_id=attempt.session_id).all()
                for event in events:
                    violations.append({
                        "type": event.event_type,
                        "reason": event.reason,
                        "confidence": event.confidence,
                        "timestamp": event.timestamp.isoformat() + 'Z'
                    })
            
            results.append(StudentAttemptSummary(
                student_email=attempt.student_email,
                attempt_id=attempt.attempt_id,
                score=attempt.score or 0,
                start_time=attempt.start_time.isoformat() + 'Z',
                end_time=attempt.end_time.isoformat() + 'Z' if attempt.end_time else '',
                auto_submitted=attempt.auto_submitted,
                violations=violations
            ))
        
        db.close()
        return {"quiz_id": quiz_id, "attempts": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get attempts: {str(e)}")
