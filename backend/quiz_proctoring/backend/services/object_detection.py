"""
Forbidden object detection using YOLOv8.
Detects mobile phones and paper with time-based confirmation.
"""
import cv2
import numpy as np
from datetime import datetime
from pathlib import Path
import torch
from ultralytics import YOLO

from utils.timers import ObjectDetectionTimer


# Forbidden object mapping from YOLO class names
# YOLOv8 uses COCO dataset class names
FORBIDDEN_OBJECT_MAP = {
    "cell phone": "mobile_phone",
    "book": "paper",
    "laptop": "laptop",
    "tv": "screen",
    "remote": "remote",
    "keyboard": "keyboard",
    "mouse": "mouse"
}

# Detection configuration
CONFIDENCE_THRESHOLD = 0.5
CHEATING_TIME_THRESHOLD = 3.0  # seconds


class ForbiddenObjectDetector:
    """
    Detects forbidden objects (mobile phone, paper) using YOLOv8.
    Triggers cheating events only after continuous detection exceeds time threshold.
    """
    
    def __init__(self, model_path: str = "yolov8n.pt", device: str = None):
        """
        Initialize the detector with YOLOv8 model.
        
        Args:
            model_path: Path to YOLOv8 weights file
            device: Device to run on ('cpu', 'cuda', or None for auto-detect)
        """
        self.model_path = Path(model_path)
        
        # Auto-detect device if not specified
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device
        
        # Load YOLOv8 model
        print(f"Loading YOLOv8 model from {self.model_path} on {self.device}...")
        self.model = YOLO(str(self.model_path))
        self.model.to(self.device)
        print(f"YOLOv8 loaded successfully on {self.device}")
        
        # Initialize timer for temporal tracking
        self.timer = ObjectDetectionTimer()
        
        # Track emitted events to avoid duplicates
        self.emitted_events = set()
    
    def detect(self, frame: np.ndarray) -> dict:
        """
        Run object detection on a single frame.
        
        Args:
            frame: Input frame (BGR format)
        
        Returns:
            Dictionary containing:
                - detections: List of detected forbidden objects with metadata
                - events: List of cheating events (if threshold crossed)
                - annotated_frame: Frame with debug overlay
        """
        # Run YOLOv8 inference
        results = self.model(frame, verbose=False)[0]
        
        # Process detections
        forbidden_detections = []
        detected_objects = []
        
        # Debug: log all detected objects
        all_detected = []
        for box in results.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = results.names[class_id]
            if confidence >= CONFIDENCE_THRESHOLD:
                all_detected.append(f"{class_name}({confidence:.2f})")
        
        if all_detected:
            print(f"[Object Detection] Detected: {', '.join(all_detected)}")
        
        for box in results.boxes:
            # Extract detection info
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = results.names[class_id]
            
            # Filter for forbidden objects with confidence threshold
            if class_name in FORBIDDEN_OBJECT_MAP and confidence >= CONFIDENCE_THRESHOLD:
                # Map to standardized name
                forbidden_name = FORBIDDEN_OBJECT_MAP[class_name]
                
                # Extract bounding box
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                
                forbidden_detections.append({
                    "object": forbidden_name,
                    "confidence": confidence,
                    "bbox": (int(x1), int(y1), int(x2), int(y2)),
                    "original_class": class_name
                })
                
                detected_objects.append(forbidden_name)
                print(f"[Object Detection] FORBIDDEN object found: {forbidden_name} ({class_name}) - confidence: {confidence:.2f}")
        
        # Update timers
        elapsed_times = self.timer.update(detected_objects)
        
        # Generate cheating events for objects exceeding threshold
        events = []
        for detection in forbidden_detections:
            obj_name = detection["object"]
            elapsed = elapsed_times.get(obj_name, 0.0)
            
            # Add elapsed time to detection
            detection["elapsed_time"] = elapsed
            
            # Check if threshold crossed
            if elapsed >= CHEATING_TIME_THRESHOLD:
                # Create unique event key to avoid duplicates
                event_key = f"{obj_name}_{int(elapsed)}"
                
                # Only emit event once per object per second
                if event_key not in self.emitted_events:
                    events.append({
                        "event": "FORBIDDEN_OBJECT",
                        "object": obj_name,
                        "duration": round(elapsed, 2),
                        "confidence": round(detection["confidence"], 2),
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    })
                    self.emitted_events.add(event_key)
        
        # Clean up old event keys
        if len(self.emitted_events) > 100:
            self.emitted_events.clear()
        
        # Create annotated frame with debug overlay
        annotated_frame = self._draw_debug_overlay(frame, forbidden_detections)
        
        return {
            "detections": forbidden_detections,
            "events": events,
            "annotated_frame": annotated_frame
        }
    
    def _draw_debug_overlay(self, frame: np.ndarray, detections: list) -> np.ndarray:
        """
        Draw bounding boxes and detection info on frame.
        
        Args:
            frame: Input frame
            detections: List of detection dictionaries
        
        Returns:
            Annotated frame
        """
        annotated = frame.copy()
        
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            obj_name = det["object"]
            confidence = det["confidence"]
            elapsed = det["elapsed_time"]
            
            # Choose color based on elapsed time
            if elapsed >= CHEATING_TIME_THRESHOLD:
                color = (0, 0, 255)  # Red - cheating threshold exceeded
            elif elapsed >= CHEATING_TIME_THRESHOLD * 0.5:
                color = (0, 165, 255)  # Orange - warning
            else:
                color = (0, 255, 255)  # Yellow - detected
            
            # Draw bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            
            # Prepare text labels
            label_text = f"{obj_name.upper()}"
            conf_text = f"Conf: {confidence:.2f}"
            time_text = f"Time: {elapsed:.1f}s"
            
            # Calculate text background size
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.6
            thickness = 2
            
            # Get text sizes
            (w1, h1), _ = cv2.getTextSize(label_text, font, font_scale, thickness)
            (w2, h2), _ = cv2.getTextSize(conf_text, font, font_scale - 0.1, thickness - 1)
            (w3, h3), _ = cv2.getTextSize(time_text, font, font_scale - 0.1, thickness - 1)
            
            # Draw background rectangles for text
            max_width = max(w1, w2, w3)
            total_height = h1 + h2 + h3 + 20
            
            # Position text above bounding box if possible
            text_y = y1 - total_height - 10 if y1 - total_height - 10 > 0 else y2 + 10
            
            cv2.rectangle(annotated, 
                         (x1, text_y), 
                         (x1 + max_width + 10, text_y + total_height),
                         color, -1)
            
            # Draw text labels
            cv2.putText(annotated, label_text, 
                       (x1 + 5, text_y + h1 + 5),
                       font, font_scale, (255, 255, 255), thickness)
            
            cv2.putText(annotated, conf_text,
                       (x1 + 5, text_y + h1 + h2 + 10),
                       font, font_scale - 0.1, (255, 255, 255), thickness - 1)
            
            cv2.putText(annotated, time_text,
                       (x1 + 5, text_y + h1 + h2 + h3 + 15),
                       font, font_scale - 0.1, (255, 255, 255), thickness - 1)
        
        return annotated
    
    def reset(self):
        """Reset all timers and event tracking."""
        self.timer.reset()
        self.emitted_events.clear()


def create_detector(model_path: str = "yolov8n.pt", device: str = None) -> ForbiddenObjectDetector:
    """
    Factory function to create a ForbiddenObjectDetector instance.
    
    Args:
        model_path: Path to YOLOv8 weights
        device: Device to run on ('cpu', 'cuda', or None for auto-detect)
    
    Returns:
        Initialized ForbiddenObjectDetector
    """
    return ForbiddenObjectDetector(model_path=model_path, device=device)
