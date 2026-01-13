"""
Gaze aversion detection using head pose estimation.
Uses YOLO face bounding box + OpenCV's solvePnP for rotation estimation.
Supports baseline calibration for relative angle measurement.
"""
import numpy as np
import cv2


# 3D face model points (generic reference face in mm)
FACE_3D_POINTS = np.array([
    [0.0, 0.0, 0.0],        # Nose tip
    [0.0, -30.0, -30.0],    # Chin
    [-22.5, 10.0, -30.0],   # Left eye
    [22.5, 10.0, -30.0],    # Right eye
    [-15.0, -25.0, -30.0],  # Left mouth corner
    [15.0, -25.0, -30.0]    # Right mouth corner
], dtype=np.float32)


class BaselineCalibrator:
    """Captures neutral yaw/pitch during first ~3 seconds for relative measurement."""
    
    def __init__(self, calibration_frames=90):
        self.calibration_frames = calibration_frames
        self.frame_count = 0
        self.angles_buffer = []
        self.is_calibrated = False
        self.baseline_yaw = 0.0
        self.baseline_pitch = 0.0
    
    def add_frame(self, yaw: float, pitch: float) -> bool:
        """
        Add a frame during calibration. Returns True when calibration is complete.
        """
        if self.is_calibrated:
            return True
        
        self.angles_buffer.append((yaw, pitch))
        self.frame_count += 1
        
        if self.frame_count >= self.calibration_frames:
            # Compute average baseline
            yaws = [y for y, _ in self.angles_buffer[-30:]]  # use last 30 frames
            pitches = [p for _, p in self.angles_buffer[-30:]]
            self.baseline_yaw = np.mean(yaws)
            self.baseline_pitch = np.mean(pitches)
            self.is_calibrated = True
            return True
        
        return False
    
    def get_delta(self, yaw: float, pitch: float) -> tuple:
        """Return (delta_yaw, delta_pitch) relative to baseline."""
        if not self.is_calibrated:
            return (0.0, 0.0)
        return (yaw - self.baseline_yaw, pitch - self.baseline_pitch)


def estimate_gaze(face_bbox, frame_shape: tuple) -> dict:
    """
    Estimate head pose from face bounding box.
    
    Args:
        face_bbox: Tuple (x1, y1, x2, y2) or None
        frame_shape: Tuple of (height, width) of the frame
    
    Returns:
        Dictionary with:
            - yaw: Yaw rotation in degrees (left/right)
            - pitch: Pitch rotation in degrees (up/down)
            - gaze_state: "FORWARD" or "AWAY"
    """
    if face_bbox is None:
        return {
            "yaw": 0.0,
            "pitch": 0.0,
            "gaze_state": "UNKNOWN"
        }
    
    height, width = frame_shape[:2]
    x1, y1, x2, y2 = face_bbox
    
    # Calculate face center and size
    face_center_x = (x1 + x2) / 2
    face_center_y = (y1 + y2) / 2
    face_width = x2 - x1
    face_height = y2 - y1
    
    # Map 2D face landmarks based on bounding box geometry
    # (nose, chin, left_eye, right_eye, left_mouth, right_mouth)
    landmarks_2d = np.array([
        [face_center_x, face_center_y],                    # Nose tip (center)
        [face_center_x, y2 - face_height * 0.1],          # Chin (lower)
        [x1 + face_width * 0.15, face_center_y - face_height * 0.2],  # Left eye
        [x2 - face_width * 0.15, face_center_y - face_height * 0.2],  # Right eye
        [x1 + face_width * 0.2, face_center_y + face_height * 0.1],   # Left mouth
        [x2 - face_width * 0.2, face_center_y + face_height * 0.1]    # Right mouth
    ], dtype=np.float32)
    
    # Camera matrix (estimated for typical webcam)
    focal_length = width
    center = (width / 2, height / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float32)
    
    # Distortion coefficients (assume minimal distortion)
    dist_coeffs = np.zeros(4)
    
    # Solve PnP: map 2D landmarks to 3D model
    try:
        success, rotation_vec, translation_vec = cv2.solvePnP(
            FACE_3D_POINTS,
            landmarks_2d,
            camera_matrix,
            dist_coeffs,
            useExtrinsicGuess=False,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
    except Exception:
        return {
            "yaw": 0.0,
            "pitch": 0.0,
            "gaze_state": "UNKNOWN"
        }
    
    if not success:
        return {
            "yaw": 0.0,
            "pitch": 0.0,
            "gaze_state": "UNKNOWN"
        }
    
    # Convert rotation vector to Euler angles using Rodrigues
    rotation_mat, _ = cv2.Rodrigues(rotation_vec)
    
    # Extract pitch, yaw, roll from rotation matrix
    # Using standard Euler angle extraction (ZYX order)
    sy = np.sqrt(rotation_mat[0, 0] ** 2 + rotation_mat[1, 0] ** 2)
    
    singular = sy < 1e-6
    
    if not singular:
        x = np.arctan2(rotation_mat[2, 1], rotation_mat[2, 2])
        y = np.arctan2(-rotation_mat[2, 0], sy)
        z = np.arctan2(rotation_mat[1, 0], rotation_mat[0, 0])
    else:
        x = np.arctan2(-rotation_mat[1, 2], rotation_mat[1, 1])
        y = np.arctan2(-rotation_mat[2, 0], sy)
        z = 0
    
    # Convert to degrees
    pitch = np.degrees(x)
    yaw = np.degrees(z)
    
    # Normalize angles to [-180, 180] range
    yaw = np.degrees(np.arctan2(np.sin(np.radians(yaw)), np.cos(np.radians(yaw))))
    pitch = np.degrees(np.arctan2(np.sin(np.radians(pitch)), np.cos(np.radians(pitch))))
    
    # Gaze state is UNKNOWN until calibration is done
    gaze_state = "UNKNOWN"
    
    return {
        "yaw": float(yaw),
        "pitch": float(pitch),
        "gaze_state": gaze_state
    }


def draw_gaze_overlay(frame, yaw: float, pitch: float, gaze_state: str, 
                      elapsed_away_time: float, is_calibrating: bool = False) -> np.ndarray:
    """
    Draw gaze estimation info on frame.
    
    Args:
        frame: Input frame
        yaw: Yaw angle in degrees
        pitch: Pitch angle in degrees
        gaze_state: "FORWARD", "AWAY", or "UNKNOWN"
        elapsed_away_time: Elapsed time looking away in seconds
        is_calibrating: True during calibration phase
    
    Returns:
        Frame with overlay drawn
    """
    frame_copy = frame.copy()
    height, width = frame.shape[:2]
    
    # Color based on state and duration
    if is_calibrating:
        color = (100, 100, 255)  # Yellow/orange - calibrating
        state_text = "◔ CALIBRATING... Look forward"
    elif gaze_state == "FORWARD":
        color = (0, 255, 0)  # Green
        state_text = "✓ LOOKING FORWARD"
    elif gaze_state == "UNKNOWN":
        color = (128, 128, 128)  # Gray
        state_text = "? UNKNOWN"
    else:
        if elapsed_away_time > 10:
            color = (0, 0, 255)  # Red - CHEATING
            state_text = f"⚠ CHEATING ({elapsed_away_time:.1f}s)"
        elif elapsed_away_time > 5:
            color = (0, 165, 255)  # Orange - SUSPICIOUS
            state_text = f"⚠ SUSPICIOUS ({elapsed_away_time:.1f}s)"
        else:
            color = (200, 200, 0)  # Cyan - AWAY but short
            state_text = f"← AWAY ({elapsed_away_time:.1f}s)"
    
    # Draw text overlay
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6
    thickness = 2
    
    # Top-left corner info
    y_offset = 30
    cv2.putText(frame_copy, f"Yaw:   {yaw:+.1f}°", (10, y_offset), 
                font, font_scale, color, thickness)
    cv2.putText(frame_copy, f"Pitch: {pitch:+.1f}°", (10, y_offset + 30), 
                font, font_scale, color, thickness)
    cv2.putText(frame_copy, state_text, (10, y_offset + 60), 
                font, font_scale, color, thickness)
    
    return frame_copy
