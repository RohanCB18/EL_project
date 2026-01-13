# Quiz Proctoring System - Phase 5 Integration

## 📚 Documentation Index

Welcome to the Phase 5 integration of the Quiz Proctoring System. This index will guide you through all available documentation.

---

## 🚀 Getting Started

**New to the system?** Start here:

1. **[QUICK_REFERENCE.txt](QUICK_REFERENCE.txt)** - Quick command reference card
2. **[PHASE_5_README.md](PHASE_5_README.md)** - Complete integration guide
3. **[start_system.py](start_system.py)** - Launch the system

**Quick Start:**

```bash
python start_system.py
```

---

## 📖 Documentation Files

### Essential Reading

| Document                                       | Purpose                      | Audience         |
| ---------------------------------------------- | ---------------------------- | ---------------- |
| **[QUICK_REFERENCE.txt](QUICK_REFERENCE.txt)** | Quick command reference      | Everyone         |
| **[PHASE_5_README.md](PHASE_5_README.md)**     | Complete integration guide   | Developers       |
| **[PHASE_5_SUMMARY.md](PHASE_5_SUMMARY.md)**   | Detailed completion report   | Project managers |
| **[ARCHITECTURE.md](ARCHITECTURE.md)**         | System architecture diagrams | Architects       |

### Implementation Details

| File                                                   | Description              |
| ------------------------------------------------------ | ------------------------ |
| **[requirements_phase5.txt](requirements_phase5.txt)** | Python dependencies      |
| **[start_system.py](start_system.py)**                 | Quick launch script      |
| **[verify_integration.py](verify_integration.py)**     | Integration verification |

---

## 🏗️ System Components

### Backend (Python/FastAPI)

```
backend/
├── main.py                      # FastAPI application
├── test_gaze_detection.py       # CV pipeline (refactored)
├── api/
│   └── routes.py                # REST endpoints
├── database/
│   └── models.py                # SQLAlchemy models
├── utils/
│   └── evidence_manager.py      # Top-K storage
├── services/                    # CV services (unchanged)
└── screenshots/                 # Evidence storage
```

### Frontend (HTML/JavaScript)

```
frontend_stub/
├── student.html                 # Student interface
└── teacher.html                 # Teacher evidence viewer
```

---

## 📡 API Endpoints

Full documentation available at: **http://localhost:8000/docs** (after starting server)

| Endpoint                 | Method | Purpose                      |
| ------------------------ | ------ | ---------------------------- |
| `/proctor/start-session` | POST   | Start new proctoring session |
| `/proctor/frame`         | POST   | Process webcam frame         |
| `/proctor/end-session`   | POST   | End session                  |
| `/proctor/evidence/{id}` | GET    | Retrieve Top-K evidences     |
| `/student`               | GET    | Student interface            |
| `/teacher`               | GET    | Teacher interface            |
| `/health`                | GET    | Health check                 |

---

## 🎯 Key Features

### ✅ Implemented

- **Gaze Detection**: MediaPipe-based iris tracking
- **Object Detection**: YOLOv8 for forbidden items
- **Evidence Storage**: Top-K strongest cheating events
- **REST API**: FastAPI endpoints
- **Database**: SQLite for metadata
- **Frontend**: Basic student/teacher interfaces

### ⚠️ Demo Limitations

- No authentication/authorization
- No HTTPS
- SQLite database (not production-ready)
- Basic UI (not polished)
- In-memory session state

---

## 🔧 Configuration

### Fixed Parameters

| Parameter          | Value     | Location               |
| ------------------ | --------- | ---------------------- |
| Top-K Evidences    | 10        | evidence_manager.py    |
| Min Confidence     | 0.8 (80%) | evidence_manager.py    |
| Server Port        | 8000      | main.py                |
| Frame Interval     | 1 second  | student.html           |
| Calibration Frames | 90 (~3s)  | test_gaze_detection.py |

### Thresholds (from CV pipeline)

| Threshold           | Value                |
| ------------------- | -------------------- |
| Gaze Away Detection | 5.0% iris deviation  |
| Suspicious Event    | 5 seconds gaze away  |
| Cheating Event      | 10 seconds gaze away |

---

## 🎓 Workflows

### Student Workflow

1. Open http://localhost:8000/student
2. Enter Student ID and Quiz ID
3. Click "Start Proctoring"
4. Allow webcam access
5. Wait for calibration (~3 seconds)
6. Take quiz (real-time monitoring)
7. Click "Stop Proctoring"

### Teacher Workflow

1. Open http://localhost:8000/teacher
2. Enter session ID
3. Click "Fetch Evidence"
4. Review Top-K cheating evidences
5. Check confidence scores and timestamps

---

## 🔍 Verification

Verify the integration didn't break the original CV pipeline:

```bash
python verify_integration.py
```

Expected output:

```
✅ All required functions found
✅ VERIFICATION PASSED
```

---

## 📊 Database Schema

### proctor_sessions

```sql
session_id    VARCHAR PRIMARY KEY
student_id    VARCHAR NOT NULL
quiz_id       VARCHAR NOT NULL
start_time    DATETIME NOT NULL
end_time      DATETIME
```

### cheating_events

```sql
id            VARCHAR PRIMARY KEY
session_id    VARCHAR FOREIGN KEY
event_type    VARCHAR NOT NULL
reason        VARCHAR NOT NULL
confidence    FLOAT NOT NULL
image_path    VARCHAR
timestamp     DATETIME NOT NULL
```

Access database:

```bash
sqlite3 backend/database/proctoring.db
```

---

## 🎯 Acceptance Criteria

All Phase 5 requirements met:

- [x] Existing gaze/object detection continues working
- [x] Dummy frontend can start webcam
- [x] Frames reach backend
- [x] Cheating screenshots are saved
- [x] Only Top-K evidences are kept
- [x] Teacher page shows strongest evidences only

---

## 🛠️ Development

### Running the System

**Option 1 - Quick Start:**

```bash
python start_system.py
```

**Option 2 - Manual:**

```bash
cd backend
python main.py
```

**Option 3 - Standalone CV (original):**

```bash
cd backend
python test_gaze_detection.py
```

### Installing Dependencies

```bash
pip install -r requirements_phase5.txt
```

### Testing

```bash
# Verify integration
python verify_integration.py

# Access API docs
# http://localhost:8000/docs

# Manual testing via interfaces
# Student: http://localhost:8000/student
# Teacher: http://localhost:8000/teacher
```

---

## 📐 Architecture Overview

```
Frontend (HTML/JS)
        ↓
    FastAPI
        ↓
   CV Pipeline ────→ Evidence Manager ────→ Screenshots/
        │                                       {session_id}/
        ↓
    Database (SQLite)
```

For detailed architecture diagrams, see **[ARCHITECTURE.md](ARCHITECTURE.md)**

---

## ⚠️ Important Notes

### This is a DEMO Integration

**Suitable for:**

- Demonstration
- Testing
- Proof of concept
- Local development

**NOT suitable for:**

- Production deployment
- Multiple concurrent users
- Security-critical applications
- High-traffic scenarios

### Why Demo Only?

- No authentication
- No HTTPS/TLS
- SQLite database (single user)
- CORS wide open
- Minimal error handling
- In-memory session state

### For Production

You would need:

1. Authentication (JWT, OAuth2)
2. HTTPS/TLS encryption
3. PostgreSQL database
4. Proper error handling
5. Rate limiting
6. Input sanitization
7. Horizontal scaling
8. Monitoring/logging
9. Professional UI
10. Containerization

---

## 📁 File Structure

```
quiz_proctoring/
├── README.md                        ← You are here
├── QUICK_REFERENCE.txt              ← Quick commands
├── PHASE_5_README.md                ← Full guide
├── PHASE_5_SUMMARY.md               ← Completion report
├── ARCHITECTURE.md                  ← System diagrams
├── requirements_phase5.txt          ← Dependencies
├── start_system.py                  ← Launch script
├── verify_integration.py            ← Verification
│
├── backend/                         ← Backend code
│   ├── main.py                      ← FastAPI app
│   ├── test_gaze_detection.py       ← CV pipeline
│   ├── api/                         ← REST endpoints
│   ├── database/                    ← SQLite DB
│   ├── utils/                       ← Evidence manager
│   ├── services/                    ← CV services
│   └── screenshots/                 ← Evidence storage
│
└── frontend_stub/                   ← Frontend UI
    ├── student.html                 ← Student page
    └── teacher.html                 ← Teacher page
```

---

## 🎉 Phase 5 Complete

**All objectives achieved:**

- ✅ Minimal refactoring (extraction only)
- ✅ No CV logic duplication
- ✅ Existing folder structure preserved
- ✅ Standalone script still functional
- ✅ Clean API integration
- ✅ Database for metadata
- ✅ Top-K evidence storage
- ✅ Dummy frontend interfaces

**Verification Status:** ✅ PASSED

---

## 🆘 Support

### Common Issues

**Q: Server won't start**

- Check if port 8000 is available
- Ensure dependencies are installed: `pip install -r requirements_phase5.txt`

**Q: Webcam not working**

- Browser must be HTTPS or localhost
- Check webcam permissions
- Try different browser

**Q: No evidence displayed**

- Ensure session had high-confidence events (≥ 0.8)
- Check screenshots folder exists
- Verify session ID is correct

**Q: Original script broken**

- Run `python verify_integration.py`
- Check that main() function unchanged
- Ensure all imports still work

### Documentation Path

1. Start with **[QUICK_REFERENCE.txt](QUICK_REFERENCE.txt)** for commands
2. Read **[PHASE_5_README.md](PHASE_5_README.md)** for full guide
3. Review **[ARCHITECTURE.md](ARCHITECTURE.md)** for system design
4. Check **[PHASE_5_SUMMARY.md](PHASE_5_SUMMARY.md)** for completion details

---

## 📞 Next Steps

1. **Launch the system:** `python start_system.py`
2. **Test student flow:** http://localhost:8000/student
3. **Test teacher flow:** http://localhost:8000/teacher
4. **Review API docs:** http://localhost:8000/docs
5. **Read architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

**Version:** Phase 5 Integration Complete
**Status:** ✅ All Acceptance Criteria Met
**Demo Ready:** Yes
**Production Ready:** No

---

_For production deployment guidance, see the "Limitations" section in [PHASE_5_README.md](PHASE_5_README.md)_
