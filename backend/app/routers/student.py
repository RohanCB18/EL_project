import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import (
    QuestionRequest, SummaryRequest, QuizRequest,
    UploadResponse, AnswerResponse, SummaryResponse, QuizResponse, QuizQuestion
)
from app.services.pdf_service import extract_text_from_pdf, split_text_into_chunks
from app.services.vector_store import create_vector_store, session_exists
from app.services.llm_service import answer_question, generate_summary, generate_quiz

router = APIRouter(prefix="/student", tags=["Student"])


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF file for processing.
    Returns a session_id for subsequent queries.
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
            message="PDF processed successfully",
            session_id=session_id,
            filename=file.filename
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@router.post("/ask", response_model=AnswerResponse)
async def ask_question(request: QuestionRequest):
    """
    Ask a question about the uploaded PDF.
    """
    if not session_exists(request.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    try:
        result = answer_question(request.session_id, request.question)
        
        return AnswerResponse(
            success=True,
            answer=result["answer"],
            sources=result.get("sources", [])[:2]  # Return first 2 source chunks
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")


@router.post("/summary", response_model=SummaryResponse)
async def get_summary(request: SummaryRequest):
    """
    Generate a summary of the uploaded PDF.
    """
    if not session_exists(request.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    try:
        summary = generate_summary(request.session_id, request.max_length or 500)
        
        return SummaryResponse(
            success=True,
            summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")


@router.post("/quiz", response_model=QuizResponse)
async def get_quiz(request: QuizRequest):
    """
    Generate a practice quiz from the uploaded PDF.
    """
    if not session_exists(request.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    try:
        quiz_data = generate_quiz(
            request.session_id,
            request.num_questions or 5,
            request.difficulty or "medium"
        )
        
        # Convert to QuizQuestion models
        quiz = [
            QuizQuestion(
                question=q.get("question", ""),
                options=q.get("options", []),
                correct_answer=q.get("correct_answer", ""),
                explanation=q.get("explanation", "")
            )
            for q in quiz_data
        ]
        
        return QuizResponse(
            success=True,
            quiz=quiz
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")
