from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import student, teacher

# Create FastAPI app
app = FastAPI(
    title="PDF Study Companion API",
    description="AI-powered PDF study companion for students and teachers",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(student.router)
app.include_router(teacher.router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "PDF Study Companion API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "ollama_model": settings.OLLAMA_MODEL,
        "embed_model": settings.OLLAMA_EMBED_MODEL
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
