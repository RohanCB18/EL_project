"""
Temporal tracking for gaze aversion events.
Independent of frame rate - tracks elapsed time in seconds.
"""
import time


class GazeTimer:
    """Tracks elapsed time for gaze-away state."""
    
    def __init__(self):
        self.start_time = None
        self.is_running = False
    
    def start(self):
        """Start the timer."""
        if not self.is_running:
            self.start_time = time.time()
            self.is_running = True
    
    def stop(self):
        """Stop and reset the timer."""
        self.start_time = None
        self.is_running = False
    
    def reset(self):
        """Reset the timer (alias for stop)."""
        self.stop()
    
    def elapsed_seconds(self) -> float:
        """Return elapsed time in seconds."""
        if not self.is_running:
            return 0.0
        return time.time() - self.start_time
    
    def is_active(self) -> bool:
        """Check if timer is running."""
        return self.is_running


class ObjectDetectionTimer:
    """
    Tracks continuous detection time for forbidden objects.
    Resets immediately when object disappears.
    Independent of frame rate.
    """
    
    def __init__(self):
        self.object_timers = {}  # {object_name: start_time}
    
    def update(self, detected_objects: list) -> dict:
        """
        Update timers based on currently detected objects.
        
        Args:
            detected_objects: List of object names currently detected
        
        Returns:
            Dictionary mapping object_name -> elapsed_seconds
        """
        current_time = time.time()
        detected_set = set(detected_objects)
        
        # Remove timers for objects no longer detected (immediate reset)
        objects_to_remove = [obj for obj in self.object_timers if obj not in detected_set]
        for obj in objects_to_remove:
            del self.object_timers[obj]
        
        # Start timers for newly detected objects
        for obj in detected_set:
            if obj not in self.object_timers:
                self.object_timers[obj] = current_time
        
        # Calculate elapsed times
        elapsed_times = {}
        for obj, start_time in self.object_timers.items():
            elapsed_times[obj] = current_time - start_time
        
        return elapsed_times
    
    def reset(self, object_name: str = None):
        """
        Reset timer for specific object or all objects.
        
        Args:
            object_name: Specific object to reset, or None to reset all
        """
        if object_name is None:
            self.object_timers.clear()
        elif object_name in self.object_timers:
            del self.object_timers[object_name]
    
    def get_elapsed(self, object_name: str) -> float:
        """
        Get elapsed time for a specific object.
        
        Args:
            object_name: Name of the object
        
        Returns:
            Elapsed seconds, or 0.0 if not being tracked
        """
        if object_name not in self.object_timers:
            return 0.0
        return time.time() - self.object_timers[object_name]
