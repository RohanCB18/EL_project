"""
FastAPI Routes for Quiz Proctoring System
Wraps existing logic from test_gaze_detection.py
"""
from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
import cv2
import uuid
from datetime import datetime
import base64

# Import existing proctoring functions
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from test_gaze_detection import start_session, end_session, process_frame
from database.models import ProctorSession, CheatingEvent, get_db_session
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
