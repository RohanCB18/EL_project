# Integration Guide: PDF Study Companion Module

This guide outlines how to integrate the **PDF Study Companion** module (Student Dashboard, Teacher Dashboard, PDF Processing) into the main application.

The module is built with **FastAPI** (Backend) and **React/Vite** (Frontend).

---

## Part 1: Backend Integration

### 1. Copy Files
Copy the entire `backend/app` folder from this module into your main backend directory, perhaps renaming it to `study_module` to keep it isolated.

Structure example:
```text
main_project/
  ├── app/
  │   ├── main.py
  │   ├── ... existing code ...
  │   └── study_module/       <-- COPY THIS HERE
  │       ├── routers/
  │       ├── services/
  │       └── models/
```

### 2. Merge Dependencies
Add these libraries to your main `requirements.txt`:
```text
langchain==0.1.0
langchain-openai>=0.0.5
faiss-cpu==1.9.0.post1
PyPDF2==3.0.1
```

### 3. Register Routers
In your main `main.py`, include the study module routers:

```python
# app/main.py
from app.study_module.routers import student, teacher

app.include_router(student.router, prefix="/student", tags=["Student"])
app.include_router(teacher.router, prefix="/teacher", tags=["Teacher"])
```

### 4. Environment Variables
Add these to your main `.env` file:
```ini
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
VECTOR_STORE_PATH=vector_stores
```

---

## Part 2: Frontend Integration

### 1. Copy Components
Copy the following folders from `frontend/src` to your main frontend project:
*   `pages/StudentDashboard.jsx` & `.css`
*   `pages/TeacherDashboard.jsx` & `.css`
*   `components/ChatInterface.jsx` & `.css`
*   `components/PdfUploader.jsx` & `.css`
*   `components/QuestionPaperGenerator.jsx` & `.css`

### 2. Merge Dependencies
Run this command in your main frontend folder to install needed packages:
```bash
npm install axios jspdf html2canvas framer-motion react-dropzone react-markdown
```

### 3. Add Routes
In your main `App.jsx` (or Router config), add the new pages:

```jsx
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

// Inside your <Routes>
<Route path="/study/student" element={<StudentDashboard />} />
<Route path="/study/teacher" element={<TeacherDashboard />} />
```

### 4. Navigation
Add links in your main Sidebar or Navbar to access the new modules:
*   **Student Study:** `/study/student`
*   **Teacher Tools:** `/study/teacher`

---

## Verification
1.  Navigate to `/study/student` -> You should see the "Student Dashboard".
2.  Upload a PDF -> Ensure it processes and persists.
3.  Check Backend Logs -> Ensure no "ImportError" from missing libraries.
