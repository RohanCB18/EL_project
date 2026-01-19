# Quiz Proctoring System - File Documentation

This document describes the purpose and functionality of each file in the Quiz Proctoring System.

---

## Root Directory Files

### `README.md`

Complete project documentation including:

- System features for students and teachers
- Security and proctoring capabilities
- Technology stack details
- Installation instructions
- Quick start guide for teachers and students
- Usage examples and screenshots

### `start_system.py`

Quick start script to launch the entire quiz proctoring system. It:

- Checks Python version (requires 3.8+)
- Verifies FastAPI installation
- Installs dependencies if missing
- Changes to backend directory and starts the server
- Displays access URLs for the landing page and API documentation

### `requirements_phase5.txt`

Python package dependencies file listing all required libraries:

- FastAPI and Uvicorn (web framework and server)
- SQLAlchemy (database ORM)
- OpenCV (computer vision)
- Ultralytics (YOLOv8 object detection)
- MediaPipe (face and gaze detection)
- PyTorch and Torchvision (deep learning)
- Other utilities (numpy, python-dateutil, etc.)

### `face_landmarker.task`

Pre-trained MediaPipe model file for facial landmark detection. Used to:

- Detect face landmarks in real-time
- Track iris/pupil positions for gaze estimation
- Support precise eye movement tracking

### `yolov8n.pt`

Pre-trained YOLOv8 nano model weights for object detection. Used to:

- Detect forbidden objects (mobile phones, books, laptops, etc.)
- Identify multiple people in frame
- Provide fast real-time object detection during proctoring

### `adld.json`

Question bank for Advanced Digital Logic Design (ADLD) subject containing:

- Multiple-choice questions about digital logic, gates, circuits
- Four options per question
- Correct answer for each question
- Used by teachers to create ADLD quizzes

### `dsa.json`

Question bank for Data Structures and Algorithms (DSA) subject containing:

- Multiple-choice questions about heaps, trees, algorithms, complexity
- Four options per question
- Correct answer for each question
- Used by teachers to create DSA quizzes

### `os.json`

Question bank for Operating Systems (OS) subject containing:

- Multiple-choice questions about OS concepts
- Four options per question
- Correct answer for each question
- Used by teachers to create OS quizzes

---

## Backend Directory (`backend/`)

### `main.py`

Main FastAPI application entry point that:

- Initializes the FastAPI application
- Configures CORS middleware for frontend communication
- Includes API routers for authentication, quizzes, and proctoring
- Serves frontend HTML pages (landing, student, teacher pages)
- Initializes the SQLite database
- Starts the Uvicorn server on port 8000

### `test_gaze_detection.py`

Core proctoring logic integrating gaze aversion and object detection:

- Uses YOLO for face detection
- Uses MediaPipe Face Mesh for iris/pupil tracking
- Detects gaze aversion based on eye movement (not just head tilt)
- Integrates YOLOv8 for forbidden object detection
- Generates structured violation events
- Manages proctoring sessions
- Processes frames from webcam feed

### `face_landmarker.task` (duplicate)

Copy of the MediaPipe model file in backend directory for easier access.

### `yolov8n.pt` (duplicate)

Copy of the YOLOv8 model weights in backend directory for easier access.

---

## API Directory (`backend/api/`)

### `__init__.py`

Python package initializer for the API module (empty file).

### `routes.py`

FastAPI route definitions for the entire system:

- **Proctoring routes** (`/proctor`):
  - Start/end proctoring sessions
  - Process webcam frames for violation detection
  - Generate violation reports
  - Manage heartbeat monitoring
- **Authentication routes** (`/auth`):
  - Student registration and login
  - Teacher registration and login
  - Subject-based access control
- **Quiz routes** (`/quiz`):
  - Create quizzes from question banks
  - Add custom questions
  - Fetch available quizzes
  - Submit quiz attempts
  - Retrieve student results
  - View violation logs

---

## Database Directory (`backend/database/`)

### `__init__.py`

Python package initializer for the database module (empty file).

### `models.py`

SQLAlchemy database models defining the schema:

- **ProctorSession**: Proctoring session records with student/quiz IDs
- **CheatingEvent**: Violation records with type, confidence, evidence
- **Student**: Student accounts with email, password hash
- **Teacher**: Teacher accounts with email, password, subject
- **Quiz**: Quiz metadata with title, subject, time limit
- **QuizQuestion**: Individual questions with options and correct answers
- **StudentAttempt**: Quiz attempt records with scores and timestamps
- **StudentAnswer**: Individual answer records for each question
- Database initialization function to create all tables

---

## Services Directory (`backend/services/`)

### `__init__.py`

Python package initializer for the services module (empty file).

### `gaze_estimation.py`

Gaze aversion detection using head pose estimation:

- Uses YOLO face bounding box detection
- Implements OpenCV's solvePnP for 3D rotation estimation
- Calculates yaw and pitch angles
- Supports baseline calibration for relative angle measurement
- Draws gaze overlay on frames showing angles and direction
- Determines if user is looking away based on angle thresholds

### `object_detection.py`

Forbidden object detection using YOLOv8:

- Detects mobile phones, books, laptops, and other forbidden items
- Uses confidence thresholds to avoid false positives
- Implements time-based confirmation (3 seconds continuous detection)
- Manages detection timers for each object type
- Generates violation events with confidence scores
- Supports both CPU and CUDA execution

---

## Utils Directory (`backend/utils/`)

### `__init__.py`

Python package initializer for the utils module (empty file).

### `evidence_manager.py`

Top-K screenshot storage management system:

- Maintains only the strongest cheating evidences per session
- Stores screenshots with confidence >= 0.8
- Keeps maximum 10 evidences per session
- Replaces lowest-confidence evidence when stronger one appears
- Saves metadata in JSON format
- Manages session directories for organized storage

### `timers.py`

Temporal tracking for violation events:

- **GazeTimer**: Tracks elapsed time for gaze-away state
- **ObjectDetectionTimer**: Tracks continuous detection time for forbidden objects
- Frame-rate independent timing using system clock
- Automatic reset when violations stop
- Supports multiple simultaneous object timers

### `frame_buffer.py`

Sliding window buffer for gaze frames:

- Stores recent gaze states with timestamps
- Supports configurable window size (default 30 frames)
- Enables temporal smoothing to avoid false positives
- Calculates statistics over time windows
- Tracks yaw and pitch angles for each frame

---

## Frontend Directory (`frontend_stub/`)

### `index.html`

Landing page for role selection:

- Clean, modern UI with centered card design
- Two buttons: "I am a Student" and "I am a Teacher"
- Redirects to appropriate authentication pages
- Includes branding and system title
- Responsive design

### `student.html`

Complete student dashboard with:

- Login/registration forms
- Quiz browsing from all subjects
- Quiz-taking interface with timer
- Live webcam proctoring during quiz
- Fullscreen enforcement
- Tab switch and window blur detection
- Results display after submission
- Violation warnings

### `teacher.html`

Complete teacher dashboard with:

- Login/registration with subject selection
- Quiz creation from subject question banks
- Custom question addition
- Student attempt review with scores
- Violation log viewing
- Evidence screenshot gallery
- Subject-restricted access control

### `student_auth.html`

Standalone student authentication page (legacy/backup):

- Login form with email and password
- Registration form
- Basic authentication without main dashboard

### `teacher_auth.html`

Standalone teacher authentication page (legacy/backup):

- Login form with email and password
- Registration form with subject selection
- Basic authentication without main dashboard

### `student_old.html`

Previous version of student dashboard (archived for reference).

### `teacher_old.html`

Previous version of teacher dashboard (archived for reference).

---

## CSS Directory (`frontend_stub/css/`)

Contains CSS stylesheets for frontend styling (if any custom styles are separated).

---

## JS Directory (`frontend_stub/js/`)

Contains JavaScript files for frontend functionality (if any scripts are separated).

---

## Screenshots Directory (`backend/screenshots/`)

Evidence storage directory organized by session:

- Each session has a subdirectory identified by UUID
- Contains violation screenshots (PNG/JPEG format)
- Includes `metadata.json` with violation details
- Automatically managed by EvidenceManager
- Stores only top-K strongest evidences

### Example Session Subdirectories:

- `13008c76-90b9-4ab5-bd5e-919e60953cc0/`
- `2100b8bc-5151-49a3-a854-769ff89fd5ad/`
- `3bd7932a-c726-4caf-939d-0244b497b9e3/`
- _(and others)_

Each contains:

- **`metadata.json`**: Violation metadata including type, confidence, timestamp, reason

---

## Backend Subdirectories

### `backend/backend/`

Appears to be a nested directory structure (possibly from reorganization):

- Contains duplicate `database/` and `screenshots/` directories
- May contain additional configuration or backup files

---

## Pycache Directories (`__pycache__/`)

Python bytecode cache directories created automatically:

- Store compiled `.pyc` files for faster execution
- Created in multiple directories: root, backend, api, database, services, utils
- Should be ignored in version control
- Auto-regenerated when source files change

---

## Summary

**Total Project Structure:**

- **8 Root Files**: Documentation, configuration, models, data
- **3 Backend Core Files**: Main application, proctoring logic, duplicates
- **2 API Files**: Route definitions and initialization
- **2 Database Files**: Models and initialization
- **3 Service Files**: Gaze detection, object detection, initialization
- **4 Utility Files**: Evidence manager, timers, frame buffer, initialization
- **7 Frontend Files**: Landing page, dashboards, authentication pages
- **17+ Screenshot Directories**: Evidence storage per session
- **Multiple Pycache Directories**: Python bytecode cache

**Key Functionalities:**

1. **Authentication**: Separate student/teacher registration and login
2. **Quiz Management**: Create, browse, take, and grade quizzes
3. **Proctoring**: Real-time webcam monitoring with AI detection
4. **Violation Detection**: Gaze aversion, forbidden objects, browser violations
5. **Evidence Storage**: Top-K screenshot management with metadata
6. **Reporting**: Comprehensive violation logs and student results

This is a complete AI-powered quiz proctoring system with separate student and teacher interfaces, real-time monitoring, and automated violation detection.
