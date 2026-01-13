"""
Frame buffer for storing gaze states with timestamps.
Supports sliding window logic to avoid false positives.
"""
from collections import deque
from dataclasses import dataclass
import time


@dataclass
class GazeFrame:
    """Single frame record with gaze state and timestamp."""
    timestamp: float
    gaze_state: str  # "FORWARD" or "AWAY"
    yaw: float
    pitch: float


class FrameBuffer:
    """Sliding window buffer for gaze frames."""
    
    def __init__(self, window_size: int = 30):
        """
        Initialize frame buffer.
        
        Args:
            window_size: Max number of frames to keep in memory
        """
        self.buffer = deque(maxlen=window_size)
        self.window_size = window_size
    
    def add(self, gaze_state: str, yaw: float, pitch: float):
        """
        Add a frame to the buffer.
        
        Args:
            gaze_state: "FORWARD" or "AWAY"
            yaw: Yaw angle in degrees
            pitch: Pitch angle in degrees
        """
        frame = GazeFrame(
            timestamp=time.time(),
            gaze_state=gaze_state,
            yaw=yaw,
            pitch=pitch
        )
        self.buffer.append(frame)
    
    def get_recent(self, seconds: float = 2.0) -> list:
        """
        Get frames from the last N seconds.
        
        Args:
            seconds: Time window in seconds
        
        Returns:
            List of GazeFrame objects within the window
        """
        if not self.buffer:
            return []
        
        current_time = time.time()
        cutoff_time = current_time - seconds
        return [f for f in self.buffer if f.timestamp >= cutoff_time]
    
    def count_away_in_window(self, seconds: float = 2.0) -> int:
        """Count frames where gaze was AWAY in recent window."""
        return sum(1 for f in self.get_recent(seconds) if f.gaze_state == "AWAY")
    
    def is_continuous_away(self, seconds: float = 2.0) -> bool:
        """
        Check if ALL frames in window are AWAY (no looking forward).
        
        Args:
            seconds: Time window in seconds
        
        Returns:
            True if continuously looking away
        """
        recent = self.get_recent(seconds)
        if not recent:
            return False
        return all(f.gaze_state == "AWAY" for f in recent)
    
    def fraction_away(self, seconds: float = 1.0) -> float:
        """
        Return fraction of frames in recent window where gaze == AWAY.
        """
        recent = self.get_recent(seconds)
        if not recent:
            return 0.0
        away_count = sum(1 for f in recent if f.gaze_state == "AWAY")
        return away_count / len(recent)

    def continuous_away_seconds(self, seconds: float = 2.0) -> float:
        """
        Compute the longest continuous AWAY duration within the recent window (in seconds).
        Useful to detect uninterrupted away periods despite intermittent frames.
        """
        recent = self.get_recent(seconds)
        if not recent:
            return 0.0

        # Sort by timestamp (should already be in order)
        recent_sorted = sorted(recent, key=lambda f: f.timestamp)

        max_cont = 0.0
        cur_start = None
        cur_end = None

        for f in recent_sorted:
            if f.gaze_state == "AWAY":
                if cur_start is None:
                    cur_start = f.timestamp
                cur_end = f.timestamp
            else:
                if cur_start is not None:
                    dur = cur_end - cur_start
                    if dur > max_cont:
                        max_cont = dur
                    cur_start = None
                    cur_end = None

        # finalize
        if cur_start is not None and cur_end is not None:
            dur = cur_end - cur_start
            if dur > max_cont:
                max_cont = dur

        return max_cont
    
    def clear(self):
        """Clear all frames from buffer."""
        self.buffer.clear()
