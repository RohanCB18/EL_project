"""
Phase 2 + 3: Integrated Gaze Aversion + Forbidden Object Detection
Uses YOLO for face detection + MediaPipe Face Mesh for actual pupil/iris position tracking.
Detects gaze aversion based on iris position within eye bounds (true eye movement, not head tilt).
PLUS: YOLOv8 object detection for forbidden objects (mobile phone, paper/books).
"""
import cv2
from ultralytics import YOLO
import json
from datetime import datetime
import sys
import numpy as np
import time
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os

# Import custom modules
from services.gaze_estimation import estimate_gaze, draw_gaze_overlay, BaselineCalibrator
from services.object_detection import create_detector
from utils.timers import GazeTimer
from utils.frame_buffer import FrameBuffer

# MediaPipe FaceLandmarker setup
# Download model if not exists
model_path = "face_landmarker.task"
if not os.path.exists(model_path):
    print("Downloading MediaPipe Face Landmarker model...")
    import urllib.request
    urllib.request.urlretrieve(
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
        model_path
    )
    print(f"Model downloaded to {model_path}")

base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)


def generate_gaze_event(level: str, duration: float, yaw: float, pitch: float) -> dict:
    """Generate structured gaze aversion event."""
    return {
        "event": "GAZE_AVERSION",
        "level": level,  # "SUSPICIOUS" or "CHEATING"
        "duration": round(duration, 2),
        "yaw": round(yaw, 1),
        "pitch": round(pitch, 1),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# ============================================================================
# INTEGRATION API - Phase 5
# These functions wrap existing logic for FastAPI integration
# ============================================================================

class ProctorSession:
    """Manages a single proctoring session state."""
    def __init__(self, session_id: str, student_id: str, quiz_id: str):
        self.session_id = session_id
        self.student_id = student_id
        self.quiz_id = quiz_id
        self.start_time = datetime.utcnow()
        self.end_time = None
        self.event_log = []
        
        # Initialize components (same as main())
        self.face_model = YOLO('yolov8n.pt')
        self.face_model.to('cuda')
        self.object_detector = create_detector(model_path='yolov8n.pt')
        self.calibrator = BaselineCalibrator(calibration_frames=15)  # Reduced to 0.5 seconds
        self.gaze_timer = GazeTimer()
        self.frame_buffer = FrameBuffer(window_size=60)
        
        # State variables
        self.smoothed_yaw = 0.0
        self.smoothed_pitch = 0.0
        self.smoothing_alpha = 0.8
        self.last_debounced_state = None
        self.baseline_iris_horizontal = 0.5
        self.baseline_iris_vertical = 0.5
        self.debounced_state = 'FORWARD'
        self.last_event_level = None
        self.frame_count = 0
        
        # MediaPipe FaceLandmarker
        base_options = python.BaseOptions(model_asset_path="face_landmarker.task")
        options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
        self.face_landmarker = vision.FaceLandmarker.create_from_options(options)
    
    def close(self):
        """Clean up resources."""
        if hasattr(self, 'face_landmarker') and self.face_landmarker:
            self.face_landmarker.close()
        self.end_time = datetime.utcnow()


def start_session(student_id: str, quiz_id: str) -> str:
    """
    Start a new proctoring session.
    
    Args:
        student_id: Unique identifier for the student
        quiz_id: Unique identifier for the quiz
    
    Returns:
        session_id: UUID of the created session
    """
    import uuid
    session_id = str(uuid.uuid4())
    
    # Create session object and store globally (for demo purposes)
    # In production, this would be managed differently
    global _active_sessions
    if '_active_sessions' not in globals():
        _active_sessions = {}
    
    session = ProctorSession(session_id, student_id, quiz_id)
    _active_sessions[session_id] = session
    
    return session_id


def end_session(session_id: str) -> dict:
    """
    End a proctoring session and return summary.
    
    Args:
        session_id: UUID of the session to end
    
    Returns:
        dict: Session summary with event counts
    """
    global _active_sessions
    if session_id not in _active_sessions:
        raise ValueError(f"Session {session_id} not found")
    
    session = _active_sessions[session_id]
    session.close()
    
    summary = {
        "session_id": session_id,
        "student_id": session.student_id,
        "quiz_id": session.quiz_id,
        "start_time": session.start_time.isoformat() + "Z",
        "end_time": session.end_time.isoformat() + "Z",
        "total_frames": session.frame_count,
        "total_events": len(session.event_log),
        "suspicious_events": sum(1 for e in session.event_log if e.get('level') == 'SUSPICIOUS'),
        "cheating_events": sum(1 for e in session.event_log if e.get('level') == 'CHEATING')
    }
    
    # Clean up
    del _active_sessions[session_id]
    
    return summary


def process_frame(session_id: str, frame: np.ndarray) -> dict:
    """
    Process a single frame for proctoring detection.
    
    Args:
        session_id: UUID of the active session
        frame: BGR image frame from webcam (numpy array)
    
    Returns:
        dict: {
            "event": "NORMAL" | "SUSPICIOUS" | "CHEATING" | "CALIBRATING",
            "confidence": float (0-1),
            "reason": str,
            "annotated_frame": np.ndarray (BGR image with overlays)
        }
    """
    global _active_sessions
    if session_id not in _active_sessions:
        raise ValueError(f"Session {session_id} not found")
    
    session = _active_sessions[session_id]
    session.frame_count += 1
    
    height, width = frame.shape[:2]
    
    # === OBJECT DETECTION (Phase 3) ===
    obj_result = session.object_detector.detect(frame)
    frame = obj_result["annotated_frame"]
    
    # Process object detection events
    for event in obj_result["events"]:
        obj_event = {
            "event": "FORBIDDEN_OBJECT",
            "level": "CHEATING",
            "object": event["object"],
            "duration": event["duration"],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        session.event_log.append(obj_event)
        
        return {
            "event": "CHEATING",
            "confidence": 1.0,
            "reason": f"Forbidden object detected: {event['object']}",
            "annotated_frame": frame
        }
    
    # === FACE DETECTION ===
    results = session.face_model(frame, conf=0.5, device=0)
    face_detected = False
    face_bbox = None
    
    for result in results:
        if result.boxes:
            box = result.boxes[0]
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            face_bbox = (int(x1), int(y1), int(x2), int(y2))
            face_detected = True
            break
    
    # Get gaze estimation
    gaze_data = estimate_gaze(face_bbox, frame.shape) if face_detected else {"yaw": 0, "pitch": 0}
    yaw = gaze_data["yaw"]
    pitch = gaze_data["pitch"]
    
    # === CALIBRATION PHASE (QUICK) ===
    if not session.calibrator.is_calibrated:
        is_cal_complete = session.calibrator.add_frame(yaw, pitch)
        session.smoothed_yaw = yaw
        session.smoothed_pitch = pitch
        
        if not is_cal_complete:
            # Still calibrating - show brief message
            frame_with_overlay = frame.copy()
            cv2.putText(frame_with_overlay, "Initializing...",
                       (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 255), 2)
            
            if face_detected and face_bbox is not None:
                x1, y1, x2, y2 = face_bbox
                cv2.rectangle(frame_with_overlay, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            return {
                "event": "CALIBRATING",
                "confidence": 0.0,
                "reason": "Initializing...",
                "annotated_frame": frame_with_overlay
            }
        # If calibration just completed, continue to detection below
    
    # === DETECTION PHASE (after calibration) ===
    iris_gaze_motion = 0.0
    
    if face_detected:
        # MediaPipe iris tracking
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        face_landmarks_result = session.face_landmarker.detect(mp_image)
        
        if face_landmarks_result.face_landmarks and len(face_landmarks_result.face_landmarks) > 0:
            landmarks = face_landmarks_result.face_landmarks[0]
            
            if len(landmarks) >= 478:
                # Calculate iris positions (same logic as main())
                left_iris_points = landmarks[468:473]
                right_iris_points = landmarks[473:478]
                
                left_iris_x = np.mean([p.x for p in left_iris_points]) * width
                left_iris_y = np.mean([p.y for p in left_iris_points]) * height
                right_iris_x = np.mean([p.x for p in right_iris_points]) * width
                right_iris_y = np.mean([p.y for p in right_iris_points]) * height
                
                # Eye bounds
                left_eye_left = landmarks[33].x * width
                left_eye_right = landmarks[133].x * width
                left_eye_top = landmarks[159].y * height
                left_eye_bottom = landmarks[144].y * height
                right_eye_left = landmarks[362].x * width
                right_eye_right = landmarks[263].x * width
                right_eye_top = landmarks[386].y * height
                right_eye_bottom = landmarks[373].y * height
                
                # Calculate eye dimensions
                left_eye_width = left_eye_right - left_eye_left
                left_eye_height = left_eye_bottom - left_eye_top
                right_eye_width = right_eye_right - right_eye_left
                right_eye_height = right_eye_bottom - right_eye_top
                
                # Iris position relative to eye bounds
                if left_eye_width > 5 and left_eye_height > 5:
                    left_iris_rel_x = (left_iris_x - left_eye_left) / left_eye_width
                    left_iris_rel_y = (left_iris_y - left_eye_top) / left_eye_height
                    left_iris_rel_x = max(0.0, min(1.0, left_iris_rel_x))
                    left_iris_rel_y = max(0.0, min(1.0, left_iris_rel_y))
                else:
                    left_iris_rel_x = 0.5
                    left_iris_rel_y = 0.5
                
                if right_eye_width > 5 and right_eye_height > 5:
                    right_iris_rel_x = (right_iris_x - right_eye_left) / right_eye_width
                    right_iris_rel_y = (right_iris_y - right_eye_top) / right_eye_height
                    right_iris_rel_x = max(0.0, min(1.0, right_iris_rel_x))
                    right_iris_rel_y = max(0.0, min(1.0, right_iris_rel_y))
                else:
                    right_iris_rel_x = 0.5
                    right_iris_rel_y = 0.5
                
                # Average both eyes
                iris_horizontal = (left_iris_rel_x + right_iris_rel_x) / 2.0
                iris_vertical = (left_iris_rel_y + right_iris_rel_y) / 2.0
                
                # Store baseline on frame 16 (after calibration)
                if session.frame_count == 16:
                    session.baseline_iris_horizontal = iris_horizontal
                    session.baseline_iris_vertical = iris_vertical
                    session.smoothed_yaw = 0.0
                
                # Calculate deviation from baseline
                if session.frame_count >= 16:
                    horizontal_deviation_signed = iris_horizontal - session.baseline_iris_horizontal
                    vertical_deviation = abs(iris_vertical - session.baseline_iris_vertical)
                    
                    if horizontal_deviation_signed < 0:
                        horizontal_deviation = abs(horizontal_deviation_signed) * 1.5
                    else:
                        horizontal_deviation = abs(horizontal_deviation_signed)
                    
                    iris_deviation = np.sqrt(horizontal_deviation**2 + vertical_deviation**2)
                    iris_gaze_motion = iris_deviation * 100.0
                    iris_gaze_motion = min(iris_gaze_motion, 100.0)
                    
                    session.smoothed_yaw = session.smoothing_alpha * iris_gaze_motion + (1 - session.smoothing_alpha) * session.smoothed_yaw
                else:
                    session.smoothed_yaw = 0.0
    
    session.smoothed_pitch = 0.0
    
    # Gaze state
    raw_gaze_state = "AWAY" if session.smoothed_yaw > 5.0 else "FORWARD"
    
    # Frame buffer and debouncing
    session.frame_buffer.add(gaze_state=raw_gaze_state, yaw=session.smoothed_yaw, pitch=session.smoothed_pitch)
    
    frac_away = session.frame_buffer.fraction_away(seconds=1.0)
    frac_forward = 1.0 - session.frame_buffer.fraction_away(seconds=0.5)
    
    # Faster recovery: lower threshold to exit AWAY state
    if session.debounced_state == 'AWAY':
        session.debounced_state = 'FORWARD' if frac_forward >= 0.60 else 'AWAY'  # Changed from 0.75 to 0.60
    else:
        session.debounced_state = 'AWAY' if frac_away >= 0.80 else 'FORWARD'
    
    session.last_debounced_state = session.debounced_state
    
    # Timer logic
    if session.debounced_state == "AWAY":
        session.gaze_timer.start()
    else:
        session.gaze_timer.reset()
    
    elapsed_away = session.gaze_timer.elapsed_seconds()
    
    # Event generation - IMMEDIATE FEEDBACK
    event_generated = False
    current_level = None
    confidence = 0.0
    reason = "Normal behavior"
    
    if session.debounced_state == "FORWARD":
        session.last_event_level = None
        current_level = "NORMAL"
        confidence = 0.0
        reason = "Looking at screen"
    elif elapsed_away > 10:
        # Cheating - log event
        current_level = "CHEATING"
        confidence = min(1.0, elapsed_away / 15.0)
        reason = f"Gaze away for {elapsed_away:.1f}s (>10s threshold)"
        if session.last_event_level != "CHEATING":
            event = generate_gaze_event("CHEATING", elapsed_away, session.smoothed_yaw, session.smoothed_pitch)
            session.event_log.append(event)
            event_generated = True
            session.last_event_level = "CHEATING"
    elif elapsed_away > 5:
        # Suspicious - log event
        current_level = "SUSPICIOUS"
        confidence = elapsed_away / 10.0
        reason = f"Gaze away for {elapsed_away:.1f}s (>5s threshold)"
        if session.last_event_level != "SUSPICIOUS":
            event = generate_gaze_event("SUSPICIOUS", elapsed_away, session.smoothed_yaw, session.smoothed_pitch)
            session.event_log.append(event)
            event_generated = True
            session.last_event_level = "SUSPICIOUS"
    elif elapsed_away > 0:
        # Looking away - immediate feedback (no event logged yet)
        current_level = "LOOKING_AWAY"
        confidence = min(0.5, elapsed_away / 5.0)
        reason = f"Looking away from screen ({elapsed_away:.1f}s)"
        session.last_event_level = None
    
    # Draw overlay
    frame_with_overlay = draw_gaze_overlay(
        frame, session.smoothed_yaw, session.smoothed_pitch, 
        session.debounced_state, elapsed_away, is_calibrating=False
    )
    
    # Add status indicators
    status_color = (0, 255, 0) if face_detected else (0, 0, 255)
    status_text = "✓ FACE DETECTED" if face_detected else "✗ NO FACE"
    cv2.putText(frame_with_overlay, status_text, 
               (width - 200, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)
    
    gaze_color = (0, 0, 255) if session.debounced_state == "AWAY" else (0, 255, 0)
    gaze_text = f"GAZE: {session.debounced_state}"
    cv2.putText(frame_with_overlay, gaze_text, 
               (width - 200, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, gaze_color, 2)
    
    return {
        "event": current_level,
        "confidence": confidence,
        "reason": reason,
        "annotated_frame": frame_with_overlay
    }


# ============================================================================
# END INTEGRATION API
# ============================================================================


def main():
    """Main gaze aversion + object detection loop with baseline calibration."""
    
    # Initialize components
    face_model = YOLO('yolov8n.pt')
    face_model.to('cuda')
    
    # Initialize object detector
    object_detector = create_detector(model_path='yolov8n.pt')
    
    calibrator = BaselineCalibrator(calibration_frames=90)  # ~3 seconds at 30fps
    gaze_timer = GazeTimer()
    frame_buffer = FrameBuffer(window_size=60)

    # smoothing state (persist across frames)
    smoothed_yaw = 0.0
    smoothed_pitch = 0.0
    smoothing_alpha = 0.8  # Higher for faster response to gaze changes
    last_debounced_state = None
    screenshots_dir = "screenshots"
    import os
    os.makedirs(screenshots_dir, exist_ok=True)
    
    # For iris-based gaze detection
    baseline_iris_horizontal = 0.5
    baseline_iris_vertical = 0.5
    last_face_center = None
    debounced_state = 'FORWARD'  # Initialize debounced state
    
    # Object detection stats
    object_event_count = 0
    
    # Webcam setup
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    frame_count = 0
    event_log = []
    last_event_level = None
    
    # Initialize MediaPipe FaceLandmarker (new API)
    with vision.FaceLandmarker.create_from_options(options) as face_landmarker:
        # Note: face_landmarker is used within this context
        pass  # Will be re-opened in the loop
    
    print("\n" + "="*60)
    print("PHASE 2+3: GAZE + OBJECT DETECTION (Integrated)")
    print("="*60)
    print("CALIBRATION PHASE: Look straight ahead at the camera")
    print("                   Keep your head and eyes STILL for ~3 seconds")
    print("="*60)
    print("After calibration, shift your EYES left/right while keeping head still:")
    print("  - Look left/right = AWAY (gaze aversion)")
    print("  - Press 'q' to quit")
    print("  - Press 's' to save events log")
    print("="*60 + "\n")
    
    try:
        with vision.FaceLandmarker.create_from_options(options) as face_landmarker:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                height, width = frame.shape[:2]
                
                # OBJECT DETECTION (Phase 3)
                obj_result = object_detector.detect(frame)
                frame = obj_result["annotated_frame"]  # Use annotated frame
                
                # Process object detection events
                for event in obj_result["events"]:
                    object_event_count += 1
                    obj_event = {
                        "event": "FORBIDDEN_OBJECT",
                        "level": "CHEATING",
                        "object": event["object"],
                        "duration": event["duration"],
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    }
                    event_log.append(obj_event)
                    print(f"\n⚠️  OBJECT DETECTED: {event['object']} for {event['duration']}s")
                    
                    # Save screenshot
                    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
                    fname = f"{screenshots_dir}/object_{event['object']}_{ts}.jpg"
                    cv2.imwrite(fname, frame)
                
                # Face detection using YOLO
                results = face_model(frame, conf=0.5, device=0)
                face_detected = False
                face_bbox = None
                
                # Extract first face bounding box
                for result in results:
                    if result.boxes:
                        box = result.boxes[0]
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        face_bbox = (int(x1), int(y1), int(x2), int(y2))
                        face_detected = True
                        break
                
                # Get gaze estimation
                gaze_data = estimate_gaze(face_bbox, frame.shape) if face_detected else {"yaw": 0, "pitch": 0}
                
                # Temporal tracking
                yaw = gaze_data["yaw"]
                pitch = gaze_data["pitch"]
                
                # CALIBRATION PHASE
                if not calibrator.is_calibrated:
                    is_cal_complete = calibrator.add_frame(yaw, pitch)
                    
                    if is_cal_complete:
                        print(f"\n✓ CALIBRATION COMPLETE")
                        print(f"  Ready for gaze detection (iris-based, MediaPipe)")
                        print(f"  Now shift your eyes LEFT/RIGHT while keeping head still.\n")
                    
                    # Apply smoothing
                    smoothed_yaw = yaw
                    smoothed_pitch = pitch
                    
                    # Draw calibration frame
                    frame_with_overlay = frame.copy()
                    cv2.putText(frame_with_overlay, 
                               f"CALIBRATING... {calibrator.frame_count}/{calibrator.calibration_frames}",
                               (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 255), 2)
                    
                    # Draw face bounding box
                    if face_detected and face_bbox is not None:
                        x1, y1, x2, y2 = face_bbox
                        cv2.rectangle(frame_with_overlay, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    
                    cv2.imshow("Gaze Aversion Detection - Phase 2", frame_with_overlay)
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('q'):
                        break
                    continue
                
                # DETECTION PHASE (after calibration)
                try:
                    # Use MEDIAPIPE IRIS TRACKING for gaze detection (true pupil position)
                    # MediaPipe iris landmarks: 468-472 (left), 473-477 (right)
                    
                    iris_gaze_motion = 0.0
                    
                    if face_detected:
                        # Run MediaPipe FaceLandmarker on the frame
                        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
                        
                        face_landmarks_result = face_landmarker.detect(mp_image)
                        
                        if face_landmarks_result.face_landmarks and len(face_landmarks_result.face_landmarks) > 0:
                            landmarks = face_landmarks_result.face_landmarks[0]
                            
                            # Extract iris centers (average of 5 iris landmarks)
                            # Left iris: 468-472, Right iris: 473-477
                            if len(landmarks) >= 478:  # Ensure we have all landmarks
                                left_iris_points = landmarks[468:473]
                                right_iris_points = landmarks[473:478]
                                
                                # Calculate iris centers in image coordinates
                                left_iris_x = np.mean([p.x for p in left_iris_points]) * width
                                left_iris_y = np.mean([p.y for p in left_iris_points]) * height
                                right_iris_x = np.mean([p.x for p in right_iris_points]) * width
                                right_iris_y = np.mean([p.y for p in right_iris_points]) * height
                                
                                # Eye region bounds (MediaPipe face landmarks)
                                # LEFT EYE: 33 (left corner), 133 (right corner), 159 (top), 144 (bottom)
                                # RIGHT EYE: 362 (left corner), 263 (right corner), 386 (top), 373 (bottom)
                                left_eye_left = landmarks[33].x * width
                                left_eye_right = landmarks[133].x * width
                                left_eye_top = landmarks[159].y * height
                                left_eye_bottom = landmarks[144].y * height
                                right_eye_left = landmarks[362].x * width
                                right_eye_right = landmarks[263].x * width
                                right_eye_top = landmarks[386].y * height
                                right_eye_bottom = landmarks[373].y * height
                                
                                # Calculate eye dimensions
                                left_eye_width = left_eye_right - left_eye_left
                                left_eye_height = left_eye_bottom - left_eye_top
                                right_eye_width = right_eye_right - right_eye_left
                                right_eye_height = right_eye_bottom - right_eye_top
                                
                                # Calculate iris position relative to eye bounds (0-1 scale)
                                # Don't mirror - just normalize within each eye
                                if left_eye_width > 5 and left_eye_height > 5:
                                    left_iris_rel_x = (left_iris_x - left_eye_left) / left_eye_width
                                    left_iris_rel_y = (left_iris_y - left_eye_top) / left_eye_height
                                    left_iris_rel_x = max(0.0, min(1.0, left_iris_rel_x))
                                    left_iris_rel_y = max(0.0, min(1.0, left_iris_rel_y))
                                else:
                                    left_iris_rel_x = 0.5
                                    left_iris_rel_y = 0.5
                                
                                if right_eye_width > 5 and right_eye_height > 5:
                                    right_iris_rel_x = (right_iris_x - right_eye_left) / right_eye_width
                                    right_iris_rel_y = (right_iris_y - right_eye_top) / right_eye_height
                                    right_iris_rel_x = max(0.0, min(1.0, right_iris_rel_x))
                                    right_iris_rel_y = max(0.0, min(1.0, right_iris_rel_y))
                                else:
                                    right_iris_rel_x = 0.5
                                    right_iris_rel_y = 0.5
                                
                                # Average both eyes for gaze direction (horizontal and vertical)
                                iris_horizontal = (left_iris_rel_x + right_iris_rel_x) / 2.0
                                iris_vertical = (left_iris_rel_y + right_iris_rel_y) / 2.0
                                
                                # Store baseline on frame 91 (calibration complete)
                                if frame_count == 91:
                                    baseline_iris_horizontal = iris_horizontal
                                    baseline_iris_vertical = iris_vertical
                                    smoothed_yaw = 0.0
                                    print(f"[DEBUG] Baseline iris position: H={iris_horizontal:.4f}, V={iris_vertical:.4f}")
                                    print(f"[DEBUG] Baseline raw iris coords: LEFT_X={left_iris_x:.2f}, LEFT_Y={left_iris_y:.2f}, RIGHT_X={right_iris_x:.2f}, RIGHT_Y={right_iris_y:.2f}")
                                    time.sleep(0.5)
                                
                                # Calculate gaze deviation from baseline
                                if frame_count >= 91:
                                    # Iris position change in both dimensions (with direction)
                                    horizontal_deviation_signed = iris_horizontal - baseline_iris_horizontal
                                    vertical_deviation = abs(iris_vertical - baseline_iris_vertical)
                                    
                                    # Apply higher threshold for leftward movements (negative values)
                                    # This compensates for left-bias in detection
                                    if horizontal_deviation_signed < 0:  # Looking left
                                        horizontal_deviation = abs(horizontal_deviation_signed) * 1.5  # 50% higher threshold for left
                                    else:  # Looking right or centered
                                        horizontal_deviation = abs(horizontal_deviation_signed)
                                    
                                    # Combined deviation (Euclidean distance)
                                    iris_deviation = np.sqrt(horizontal_deviation**2 + vertical_deviation**2)
                                    
                                    # Convert to percentage (0.0 = centered, ~0.7 = extreme corners)
                                    iris_gaze_motion = iris_deviation * 100.0
                                    
                                    # Clamp to 0-100
                                    iris_gaze_motion = min(iris_gaze_motion, 100.0)
                                    
                                    # Smooth with fast response
                                    smoothed_yaw = smoothing_alpha * iris_gaze_motion + (1 - smoothing_alpha) * smoothed_yaw
                                    
                                    # Debug output every 20 frames
                                    if frame_count % 20 == 0:
                                        print(f"[DEBUG Frame {frame_count}] Iris: H={iris_horizontal:.4f}, V={iris_vertical:.4f}, Baseline_H={baseline_iris_horizontal:.4f}, Baseline_V={baseline_iris_vertical:.4f}, Dev={iris_deviation:.4f} ({iris_gaze_motion:.2f}%)")
                                else:
                                    smoothed_yaw = 0.0
                            else:
                                smoothed_yaw = 0.0
                        else:
                            smoothed_yaw = 0.0
                    else:
                        smoothed_yaw = 0.0
                    
                    smoothed_pitch = 0.0
                    
                    # Gaze state: AWAY if iris moved significantly from baseline
                    # Threshold: 5.0% iris position change = looking away (allows comfortable screen reading)
                    raw_gaze_state = "AWAY" if smoothed_yaw > 5.0 else "FORWARD"
                    
                    # Debug: print motion every 20 frames
                    if frame_count % 20 == 0 and frame_count >= 91:
                        print(f"[FRAME {frame_count}] Landmark Motion: {smoothed_yaw:.2f}% | State: {raw_gaze_state}")

                
                    # Add to frame buffer with computed state
                    frame_buffer.add(gaze_state=raw_gaze_state, yaw=smoothed_yaw, pitch=smoothed_pitch)
                    
                    # Debouncing using recent window - fast response to gaze changes
                    frac_away = frame_buffer.fraction_away(seconds=1.0)
                    frac_forward = frame_buffer.fraction_away(seconds=0.5)  # FORWARD fraction in shorter window
                    frac_forward = 1.0 - frac_forward  # Invert to get FORWARD percentage
                    
                    # Determine debounced state with asymmetric debouncing:
                    # - Need 80% AWAY over 1.0s to trigger AWAY (strict entry to prevent false positives)
                    # - Need 75% FORWARD over 0.5s to return to FORWARD (easier exit for fast recovery)
                    if debounced_state == 'AWAY':
                        # Already in AWAY, need 75% FORWARD to recover (easier recovery)
                        debounced_state = 'FORWARD' if frac_forward >= 0.75 else 'AWAY'
                    else:
                        # In FORWARD, need 80% AWAY to trigger AWAY (strict entry)
                        debounced_state = 'AWAY' if frac_away >= 0.80 else 'FORWARD'
                    
                    # Capture screenshots on transition to AWAY
                    if debounced_state == 'AWAY' and last_debounced_state != 'AWAY':
                        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
                        fname = f"{screenshots_dir}/away_transition_{ts}.jpg"
                        cv2.imwrite(fname, frame)
                    
                    last_debounced_state = debounced_state
                    
                    # Timer logic
                    if debounced_state == "AWAY":
                        gaze_timer.start()
                    else:
                        gaze_timer.reset()
                    
                    elapsed_away = gaze_timer.elapsed_seconds()
                    
                    # Event generation
                    event_generated = False
                    current_level = None
                    
                    if debounced_state == "FORWARD":
                        # Reset event level when looking forward
                        last_event_level = None
                    elif elapsed_away > 10:
                        current_level = "CHEATING"
                        if last_event_level != "CHEATING":
                            event = generate_gaze_event("CHEATING", elapsed_away, smoothed_yaw, smoothed_pitch)
                            event_log.append(event)
                            event_generated = True
                            last_event_level = "CHEATING"
                    elif elapsed_away > 5:
                        current_level = "SUSPICIOUS"
                        if last_event_level != "SUSPICIOUS":
                            event = generate_gaze_event("SUSPICIOUS", elapsed_away, smoothed_yaw, smoothed_pitch)
                            event_log.append(event)
                            event_generated = True
                            last_event_level = "SUSPICIOUS"
                    
                    # Print events
                    if event_generated:
                        print(f"\n[FRAME {frame_count}] EVENT GENERATED:")
                        print(json.dumps(event_log[-1], indent=2))
                        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
                        level = event_log[-1]['level']
                        fname = f"{screenshots_dir}/event_{level.lower()}_{ts}.jpg"
                        cv2.imwrite(fname, frame)
                    
                    # Draw overlay with relative angles
                    frame_with_overlay = draw_gaze_overlay(
                        frame, smoothed_yaw, smoothed_pitch, debounced_state, elapsed_away, is_calibrating=False
                    )
                    
                    # Debug metrics
                    debug_text = (f"Δyaw={smoothed_yaw:+.1f}% Δpitch={smoothed_pitch:+.1f}% | "
                                 f"frac_away={frac_away:.2f} frac_fwd={frac_forward:.2f}")
                    cv2.putText(frame_with_overlay, debug_text, (10, height - 10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                    
                    # Baseline reference
                    baseline_text = f"Baseline iris: {baseline_iris_horizontal:.2f}"
                    cv2.putText(frame_with_overlay, baseline_text, (10, 120),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                    
                    # Face detection status
                    status_color = (0, 255, 0) if face_detected else (0, 0, 255)
                    status_text = "✓ FACE DETECTED" if face_detected else "✗ NO FACE"
                    cv2.putText(frame_with_overlay, status_text, 
                               (width - 200, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)
                    
                    # Gaze state (AWAY/FORWARD)
                    gaze_color = (0, 0, 255) if debounced_state == "AWAY" else (0, 255, 0)
                    gaze_text = f"GAZE: {debounced_state}"
                    cv2.putText(frame_with_overlay, gaze_text, 
                               (width - 200, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, gaze_color, 2)
                    
                    # Draw eye bounding boxes instead of face bbox
                    if face_detected and face_landmarks_result and face_landmarks_result.face_landmarks:
                        # Get eye landmarks from MediaPipe
                        landmarks = face_landmarks_result.face_landmarks[0]
                        
                        # LEFT EYE: landmarks 33 (left corner), 133 (right corner), with y from 159 (top) and 144 (bottom)
                        left_eye_left = int(landmarks[33].x * width)
                        left_eye_right = int(landmarks[133].x * width)
                        left_eye_top = int(landmarks[159].y * height)
                        left_eye_bottom = int(landmarks[144].y * height)
                        
                        # RIGHT EYE: landmarks 362 (left corner), 263 (right corner), with y from 386 (top) and 373 (bottom)
                        right_eye_left = int(landmarks[362].x * width)
                        right_eye_right = int(landmarks[263].x * width)
                        right_eye_top = int(landmarks[386].y * height)
                        right_eye_bottom = int(landmarks[373].y * height)
                        
                        # Draw LEFT eye bbox
                        eye_color = (0, 0, 255) if debounced_state == "AWAY" else (0, 255, 0)
                        cv2.rectangle(frame_with_overlay, (left_eye_left, left_eye_top), 
                                    (left_eye_right, left_eye_bottom), eye_color, 2)
                        cv2.putText(frame_with_overlay, "L", (left_eye_left - 15, left_eye_top - 5),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, eye_color, 1)
                        
                        # Draw RIGHT eye bbox
                        cv2.rectangle(frame_with_overlay, (right_eye_left, right_eye_top), 
                                    (right_eye_right, right_eye_bottom), eye_color, 2)
                        cv2.putText(frame_with_overlay, "R", (right_eye_right + 5, right_eye_top - 5),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, eye_color, 1)
                    
                    # Show frame
                    cv2.imshow("Integrated Proctoring - Phase 2+3", frame_with_overlay)
                    
                    # Handle input
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('q'):
                        break
                    elif key == ord('s'):
                        log_file = f"gaze_events_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                        with open(log_file, 'w') as f:
                            json.dump(event_log, f, indent=2)
                        print(f"\nEvents saved to {log_file}")
                
                except Exception as e:
                    print(f"[ERROR] Detection phase exception at frame {frame_count}: {e}")
                    import traceback
                    traceback.print_exc()
                    break
    
    finally:
        # Summary
        print("\n" + "="*60)
        print("SESSION SUMMARY")
        print("="*60)
        print(f"Total frames processed: {frame_count}")
        print(f"Total gaze events: {len([e for e in event_log if e['event'] == 'GAZE_AVERSION'])}")
        print(f"Total object events: {object_event_count}")
        print(f"Total events generated: {len(event_log)}")
        
        if calibrator.is_calibrated:
            print(f"\nCalibration Baseline:")
            print(f"  Yaw:   {calibrator.baseline_yaw:+.2f}°")
            print(f"  Pitch: {calibrator.baseline_pitch:+.2f}°")
        
        if event_log:
            print("\nEvent breakdown:")
            suspicious = sum(1 for e in event_log if e['level'] == 'SUSPICIOUS')
            cheating = sum(1 for e in event_log if e['level'] == 'CHEATING')
            print(f"  - Suspicious: {suspicious}")
            print(f"  - Cheating:   {cheating}")
        
        print("="*60 + "\n")
        
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        
        # Return exit code
        sys.exit(1 if len(event_log) > 0 else 0)


if __name__ == "__main__":
    main()
