"""
Main FastAPI Application for Quiz Proctoring System
Serves both API endpoints and frontend HTML pages
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Get absolute paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend_stub")

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Import API routes
from api.routes import router, auth_router, quiz_router
from database.models import init_database

# Initialize database
init_database()

# Create FastAPI app
app = FastAPI(
    title="Quiz Proctoring API",
    description="AI-powered quiz proctoring with gaze detection and object detection",
    version="1.0.0-demo"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # DEMO ONLY - In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)  # Proctoring routes with /proctor prefix
app.include_router(auth_router)  # Auth routes with /auth prefix
app.include_router(quiz_router)  # Quiz routes with /quiz prefix

# Mount static files (CSS, JS, etc.)
if os.path.exists(FRONTEND_DIR):
    app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")

# Serve frontend pages
@app.get("/")
async def root():
    """Landing page - Student or Teacher selection."""
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/student_auth")
async def student_auth_page():
    """Student authentication page."""
    return FileResponse(os.path.join(FRONTEND_DIR, "student_auth.html"))

@app.get("/teacher_auth")
async def teacher_auth_page():
    """Teacher authentication page."""
    return FileResponse(os.path.join(FRONTEND_DIR, "teacher_auth.html"))

@app.get("/student")
async def student_page():
    """Student proctoring interface."""
    return FileResponse(os.path.join(FRONTEND_DIR, "student.html"))

@app.get("/teacher")
async def teacher_page():
    """Teacher evidence review interface."""
    return FileResponse(os.path.join(FRONTEND_DIR, "teacher.html"))

# Health check
@app.get("/health")
async def health_check():
    """System health check."""
    return {
        "status": "ok",
        "service": "Quiz Proctoring System",
        "version": "1.0.0-demo",
        "demo": True
    }


if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("QUIZ PROCTORING SYSTEM - PHASE 5 INTEGRATION")
    print("="*60)
    print("⚠️  DEMO ONLY - Not production ready")
    print("\nStarting server...")
    print("\n📱 Student Interface: http://localhost:8000/student")
    print("👨‍🏫 Teacher Interface: http://localhost:8000/teacher")
    print("\n📚 API Documentation: http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
