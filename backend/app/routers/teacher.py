import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import (
    QuestionPaperRequest, UploadResponse, QuestionPaperResponse
)
from app.services.pdf_service import extract_text_from_pdf, split_text_into_chunks
from app.services.vector_store import create_vector_store, session_exists
from app.services.llm_service import generate_question_paper

router = APIRouter(prefix="/teacher", tags=["Teacher"])


@router.post("/upload", response_model=UploadResponse)
async def upload_topic_material(file: UploadFile = File(...)):
    """
    Upload a PDF with topic material for question paper generation.
    Returns a session_id for generating question papers.
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Read file content
        content = await file.read()
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Extract text from PDF
        text = extract_text_from_pdf(content)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Split into chunks
        chunks = split_text_into_chunks(text)
        
        # Create vector store
        create_vector_store(chunks, session_id)
        
        return UploadResponse(
            success=True,
            message="Topic material processed successfully",
            session_id=session_id,
            filename=file.filename
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.post("/generate-paper", response_model=QuestionPaperResponse)
async def generate_paper(request: QuestionPaperRequest):
    """
    Generate a question paper based on uploaded topic material.
    Returns structured question paper data that can be converted to PDF on frontend.
    """
    if not session_exists(request.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Please upload topic material first.")
    
    try:
        paper = generate_question_paper(
            session_id=request.session_id,
            topic=request.topic,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            include_answers=request.include_answers,
            question_types=request.question_types
        )
        
        return QuestionPaperResponse(
            success=True,
            title=paper.get("title", f"Question Paper - {request.topic}"),
            instructions=paper.get("instructions", "Answer all questions carefully."),
            sections=paper.get("sections", []),
            total_marks=paper.get("total_marks", request.num_questions * 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating question paper: {str(e)}")
