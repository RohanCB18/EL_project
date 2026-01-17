# Quiz Proctoring System

A complete AI-powered quiz management and proctoring system with real-time monitoring, browser security enforcement, and violation detection.

## Features

### 🎓 For Students

- Register and login with email authentication
- View available quizzes from all subjects
- Take quizzes with live proctoring
- Automatic webcam monitoring during quiz
- Timer-based quiz completion (2 minutes per question)
- View results with correct answers after submission
- One attempt per quiz

### 👨‍🏫 For Teachers

- Register with subject specialization (ADLD, DSA, or OS)
- Create quizzes from subject question banks
- Add custom questions with multiple-choice options
- Review student attempts with scores
- View violation logs and proctoring evidence
- Subject-restricted access (teachers can only manage their subject)

### 🔒 Security & Proctoring

- **Webcam Monitoring**: Real-time facial and gaze detection
- **Browser Violations** (Auto-submit quiz):
  - Fullscreen exit
  - Tab switching
  - Window blur/lost focus
- **Gaze Violations** (Logged only):
  - Looking away from screen
  - Multiple people detected
  - Forbidden objects detected
- **Evidence Storage**: Screenshots saved for teacher review
- **Heartbeat Monitoring**: Detects tampering attempts

## Technology Stack

### Backend

- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: Database ORM
- **SQLite**: Local database storage
- **OpenCV**: Computer vision for proctoring
- **MediaPipe**: Face and gaze detection

### Frontend

- **Plain HTML/CSS/JavaScript**: No frameworks
- **WebRTC**: Webcam access
- **Fetch API**: REST API communication

## Installation

### Prerequisites

- Python 3.8+
- Webcam (for proctoring)
- Modern web browser (Chrome/Edge recommended)

### Setup

1. **Navigate to project directory:**

   ```bash
   cd d:\desktop\EL_project\backend\quiz_proctoring
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements_phase5.txt
   ```

3. **Run the system:**

   ```bash
   python backend/main.py
   ```

4. **Access the application:**
   - Landing Page: http://localhost:8000/
   - API Documentation: http://localhost:8000/docs

## Quick Start Guide

### For Teachers

1. **Register**
   - Navigate to http://localhost:8000/
   - Click "I am a Teacher"
   - Register with email, password, and select your subject
   - Login with credentials

2. **Create a Quiz**
   - Click "Create Quiz" tab (default view)
   - Enter quiz title
   - Click "Load Questions from Subject"
   - Select questions by clicking tiles (they turn blue when selected)
   - Optionally add custom questions in the yellow section
   - Click "Create Quiz" button
   - Quiz is now available to all students

3. **Review Student Attempts**
   - Click "Review Quizzes" tab
   - Click on any quiz to view attempts
   - See student scores, violations, and proctoring evidence

### For Students

1. **Register**
   - Navigate to http://localhost:8000/
   - Click "I am a Student"
   - Register with email and password
   - Login with credentials

2. **Take a Quiz**
   - View available quizzes on the dashboard
   - Click "Start Quiz" on any available quiz
   - Allow webcam access when prompted
   - Browser enters fullscreen automatically
   - Answer questions (timer counts down)
   - Click "Submit Quiz" or wait for auto-submit
   - View your score and correct answers

3. **Important Notes**
   - Stay in fullscreen mode during quiz
   - Do not switch tabs or minimize browser
   - Keep facing the webcam
   - Violations will auto-submit your quiz

## Project Structure

```
quiz_proctoring/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── api/
│   │   ├── routes.py          # All API endpoints
│   ├── database/
│   │   ├── models.py          # Database models
│   │   └── proctoring.db      # SQLite database (auto-created)
│   ├── services/
│   │   ├── gaze_estimation.py # Gaze detection logic
│   │   └── object_detection.py # Object detection logic
│   └── utils/
│       ├── evidence_manager.py # Screenshot management
│       ├── frame_buffer.py    # Frame processing
│       └── timers.py          # Timer utilities
├── frontend_stub/
│   ├── index.html             # Landing page
│   ├── student_auth.html      # Student login/register
│   ├── teacher_auth.html      # Teacher login/register
│   ├── student.html           # Student dashboard
│   └── teacher.html           # Teacher dashboard
├── adld.json                  # ADLD question bank
├── dsa.json                   # DSA question bank
├── os.json                    # OS question bank
├── face_landmarker.task       # MediaPipe model
├── yolov8n.pt                 # YOLO model
└── requirements_phase5.txt    # Python dependencies
```

## API Endpoints

### Authentication

- `POST /auth/student/register` - Register student
- `POST /auth/student/login` - Login student
- `POST /auth/teacher/register` - Register teacher
- `POST /auth/teacher/login` - Login teacher

### Quiz Management

- `GET /quiz/questions/{subject}` - Load questions from JSON
- `POST /quiz/create` - Create new quiz
- `GET /quiz/list` - List all quizzes
- `GET /quiz/{quiz_id}` - Get quiz details
- `POST /quiz/start-attempt` - Start quiz attempt
- `POST /quiz/submit` - Submit quiz answers
- `GET /quiz/{quiz_id}/attempts` - Get student attempts (teacher)

### Proctoring

- `POST /proctor/start-session` - Start proctoring session
- `POST /proctor/frame` - Process webcam frame
- `POST /proctor/end-session` - End proctoring session
- `POST /proctor/browser-event` - Log browser violation
- `POST /proctor/heartbeat` - Heartbeat ping
- `GET /proctor/evidence/{session_id}` - Get evidence

## Database Schema

### Core Tables

- `students` - Student authentication
- `teachers` - Teacher authentication with subject
- `quizzes` - Quiz metadata
- `quiz_questions` - Question storage (from JSON + custom)
- `student_attempts` - Quiz attempt tracking
- `student_answers` - Individual answers

### Proctoring Tables

- `proctor_sessions` - Proctoring session metadata
- `cheating_events` - Detected violations with evidence

## Configuration

### Quiz Rules

- **Time Limit**: 2 minutes per question (automatic)
- **Attempts**: 1 attempt per quiz per student
- **Question Selection**: Teacher selects from JSON bank + custom
- **Subjects**: adld, dsa, os

### Security Settings

- **Browser Violations**: Auto-submit after 2 seconds
- **Evidence Retention**: Top 10 highest confidence events
- **Minimum Confidence**: 0.8 for screenshot storage
- **Fullscreen**: Required during quiz

## Development

### Running in Development Mode

The server runs with auto-reload enabled by default:

```bash
python backend/main.py
```

### Testing

1. Register a teacher account
2. Create a quiz with 2-3 questions
3. Register a student account
4. Take the quiz
5. Review results as teacher

### Adding New Question Banks

1. Create a JSON file in root directory (e.g., `math.json`)
2. Format: Array of objects with `question`, `options`, `answer`
3. Update teacher registration to include new subject
4. Restart server

## Troubleshooting

### Webcam Not Working

- Ensure browser has camera permissions
- Check if camera is being used by another application
- Try refreshing the page

### Quiz Not Appearing

- Verify teacher created quiz successfully
- Check if student is logged in
- Refresh the student dashboard

### Auto-Submit Issues

- Browser violations trigger auto-submit (expected behavior)
- Stay in fullscreen and avoid tab switching
- Don't minimize or blur the window

### Database Issues

- Delete `backend/database/proctoring.db` to reset
- Database auto-creates on first run
- Check file permissions

## Security Notes

⚠️ **This is a demo system for educational purposes:**

- Uses simple password hashing (SHA-256)
- No session management or JWT
- CORS set to allow all origins
- Local SQLite database
- No production-ready security measures

**For production deployment, implement:**

- Proper authentication (JWT, OAuth)
- Password salting with bcrypt/argon2
- HTTPS/TLS encryption
- Rate limiting
- Input validation and sanitization
- Proper CORS configuration
- Cloud database (PostgreSQL, MySQL)

## License

Educational/Demo Project - Not for production use

## Support

For issues or questions, refer to the API documentation at http://localhost:8000/docs when the server is running.
