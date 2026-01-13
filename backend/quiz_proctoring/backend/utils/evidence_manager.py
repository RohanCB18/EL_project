"""
Evidence Manager - Top-K Screenshot Storage
Maintains only the strongest cheating evidences per session
"""
import os
import cv2
import numpy as np
from datetime import datetime
from typing import Optional
import json


class EvidenceManager:
    """
    Manages Top-K screenshot storage for cheating events.
    
    Rules:
    - Only stores screenshots with confidence >= 0.8
    - Maintains maximum K evidences per session
    - Replaces lowest-confidence evidence when a stronger one appears
    """
    
    def __init__(self, base_dir: str = "backend/screenshots", top_k: int = 10, min_confidence: float = 0.8):
        """
        Initialize evidence manager.
        
        Args:
            base_dir: Base directory for storing screenshots
            top_k: Maximum number of evidences to keep per session
            min_confidence: Minimum confidence threshold for storing
        """
        self.base_dir = base_dir
        self.top_k = top_k
        self.min_confidence = min_confidence
        
        # In-memory tracking of evidences per session
        self.session_evidences = {}  # {session_id: [{confidence, path, reason, timestamp}, ...]}
        
        # Ensure base directory exists
        os.makedirs(base_dir, exist_ok=True)
    
    def _get_session_dir(self, session_id: str) -> str:
        """Get the directory path for a session's screenshots."""
        session_dir = os.path.join(self.base_dir, session_id)
        os.makedirs(session_dir, exist_ok=True)
        return session_dir
    
    def _get_metadata_path(self, session_id: str) -> str:
        """Get the path to the metadata file for a session."""
        return os.path.join(self._get_session_dir(session_id), "metadata.json")
    
    def _load_session_metadata(self, session_id: str):
        """Load session metadata from disk."""
        metadata_path = self._get_metadata_path(session_id)
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                self.session_evidences[session_id] = json.load(f)
        else:
            self.session_evidences[session_id] = []
    
    def _save_session_metadata(self, session_id: str):
        """Save session metadata to disk."""
        metadata_path = self._get_metadata_path(session_id)
        with open(metadata_path, 'w') as f:
            json.dump(self.session_evidences[session_id], f, indent=2)
    
    def add_evidence(self, session_id: str, frame: np.ndarray, confidence: float, 
                     reason: str, event_type: str) -> Optional[str]:
        """
        Add evidence screenshot if it meets criteria.
        
        Args:
            session_id: UUID of the session
            frame: BGR image frame (numpy array)
            confidence: Confidence score (0-1)
            reason: Description of the cheating behavior
            event_type: Type of event ("GAZE_AVERSION" or "FORBIDDEN_OBJECT")
        
        Returns:
            str: Path to saved screenshot, or None if not saved
        """
        # Check minimum confidence threshold
        if confidence < self.min_confidence:
            return None
        
        # Load session metadata if not already loaded
        if session_id not in self.session_evidences:
            self._load_session_metadata(session_id)
        
        evidences = self.session_evidences[session_id]
        
        # Generate filename
        timestamp = datetime.utcnow()
        timestamp_str = timestamp.strftime('%Y%m%d_%H%M%S_%f')
        filename = f"{event_type.lower()}_{timestamp_str}.jpg"
        filepath = os.path.join(self._get_session_dir(session_id), filename)
        
        # Check if we should add this evidence
        should_add = False
        remove_evidence = None
        
        if len(evidences) < self.top_k:
            # Have space, just add
            should_add = True
        else:
            # Find the evidence with lowest confidence
            min_evidence = min(evidences, key=lambda x: x['confidence'])
            
            if confidence > min_evidence['confidence']:
                # New evidence is stronger, replace weakest
                should_add = True
                remove_evidence = min_evidence
        
        if should_add:
            # Save the image
            cv2.imwrite(filepath, frame)
            
            # Add to metadata
            evidence_entry = {
                "confidence": confidence,
                "path": filepath,
                "reason": reason,
                "event_type": event_type,
                "timestamp": timestamp.isoformat() + "Z"
            }
            evidences.append(evidence_entry)
            
            # Remove weakest if necessary
            if remove_evidence:
                evidences.remove(remove_evidence)
                # Delete the old file
                if os.path.exists(remove_evidence['path']):
                    os.remove(remove_evidence['path'])
            
            # Save metadata
            self._save_session_metadata(session_id)
            
            return filepath
        
        return None
    
    def get_evidences(self, session_id: str) -> list:
        """
        Get all evidences for a session, sorted by confidence (highest first).
        
        Args:
            session_id: UUID of the session
        
        Returns:
            list: List of evidence dictionaries sorted by confidence
        """
        if session_id not in self.session_evidences:
            self._load_session_metadata(session_id)
        
        evidences = self.session_evidences.get(session_id, [])
        
        # Sort by confidence (descending)
        evidences_sorted = sorted(evidences, key=lambda x: x['confidence'], reverse=True)
        
        return evidences_sorted
    
    def clear_session(self, session_id: str):
        """
        Clear all evidences for a session.
        
        Args:
            session_id: UUID of the session
        """
        if session_id in self.session_evidences:
            # Delete all files
            for evidence in self.session_evidences[session_id]:
                if os.path.exists(evidence['path']):
                    os.remove(evidence['path'])
            
            # Delete metadata
            metadata_path = self._get_metadata_path(session_id)
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
            
            # Remove from memory
            del self.session_evidences[session_id]
            
            # Remove directory if empty
            session_dir = self._get_session_dir(session_id)
            if os.path.exists(session_dir) and not os.listdir(session_dir):
                os.rmdir(session_dir)


# Demo configuration
print("=" * 60)
print("EVIDENCE MANAGER MODULE LOADED")
print("=" * 60)
print("⚠️  DEMO ONLY - Top-K evidence storage")
print(f"📁 Storage: backend/screenshots/{{session_id}}/")
print(f"📊 Top-K: 10")
print(f"📈 Min Confidence: 0.8")
print("=" * 60)
