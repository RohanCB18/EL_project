from typing import List, Optional
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from langchain_community.llms import Ollama
from langchain.schema import Document
from app.config import settings
from app.services.vector_store import similarity_search, load_vector_store
import json


def get_llm(temperature: float = 0):
    """Get Ollama LLM instance."""
    return Ollama(
        model=settings.OLLAMA_MODEL,
        temperature=temperature
    )


def get_qa_chain():
    """
    Get the RAG-based question answering chain.
    Uses a strict prompt to only answer from provided context.
    """
    prompt_template = """
    You are an AI assistant answering questions strictly based on the provided PDF content.

    Rules you MUST follow:
    1. Use ONLY the information present in the given context.
    2. DO NOT use any external knowledge.
    3. DO NOT guess or assume missing information.
    4. If the answer is NOT present in the context, reply exactly:
       "The answer is not available in the provided PDF."

    Context:
    {context}

    Question:
    {question}

    Answer (from PDF only):
    """

    llm = get_llm(temperature=0)
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question"]
    )

    return load_qa_chain(llm, chain_type="stuff", prompt=prompt)


def answer_question(session_id: str, question: str) -> dict:
    """
    Answer a question based on the uploaded PDF content.
    
    Args:
        session_id: Session identifier with uploaded PDF
        question: User's question
        
    Returns:
        Dictionary with answer and source chunks
    """
    # Get relevant chunks
    relevant_chunks = similarity_search(session_id, question, k=4)
    
    # Convert to Document objects for the chain
    docs = [Document(page_content=chunk) for chunk in relevant_chunks]
    
    # Get answer
    chain = get_qa_chain()
    response = chain(
        {"input_documents": docs, "question": question},
        return_only_outputs=True
    )
    
    return {
        "answer": response["output_text"],
        "sources": relevant_chunks
    }


def generate_summary(session_id: str, max_length: int = 500) -> str:
    """
    Generate a summary of the uploaded PDF content.
    
    Args:
        session_id: Session identifier with uploaded PDF
        max_length: Maximum length of summary
        
    Returns:
        Summary text
    """
    # Get a broad sample of the document
    db = load_vector_store(session_id)
    if db is None:
        raise ValueError(f"No vector store found for session: {session_id}")
    
    # Search for general content
    docs = db.similarity_search("main topic summary overview", k=6)
    context = "\n\n".join([doc.page_content for doc in docs])
    
    prompt = f"""
    Based on the following content from a PDF document, provide a comprehensive summary.
    The summary should capture the main topics, key points, and important details.
    Keep the summary under {max_length} words.
    
    Content:
    {context}
    
    Summary:
    """
    
    llm = get_llm(temperature=0.3)
    summary = llm.invoke(prompt)
    
    return summary


def generate_quiz(
    session_id: str,
    num_questions: int = 5,
    difficulty: str = "medium"
) -> List[dict]:
    """
    Generate a quiz based on the uploaded PDF content.
    
    Args:
        session_id: Session identifier with uploaded PDF
        num_questions: Number of questions to generate
        difficulty: Difficulty level (easy, medium, hard)
        
    Returns:
        List of quiz questions with options and answers
    """
    db = load_vector_store(session_id)
    if db is None:
        raise ValueError(f"No vector store found for session: {session_id}")
    
    # Get diverse content from the document
    docs = db.similarity_search("key concepts important facts definitions", k=8)
    context = "\n\n".join([doc.page_content for doc in docs])
    
    prompt = f"""
    Based on the following content, generate exactly {num_questions} quiz questions.
    Difficulty level: {difficulty}
    
    For each question, provide:
    1. The question
    2. Four multiple choice options (A, B, C, D)
    3. The correct answer
    4. A brief explanation
    
    Return the response as a valid JSON array with this exact format:
    [
        {{
            "question": "Question text here?",
            "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
            "correct_answer": "A",
            "explanation": "Brief explanation here"
        }}
    ]
    
    Content:
    {context}
    
    JSON Quiz:
    """
    
    llm = get_llm(temperature=0.5)
    response = llm.invoke(prompt)
    
    # Parse JSON response
    try:
        # Try to extract JSON from the response
        json_start = response.find('[')
        json_end = response.rfind(']') + 1
        if json_start != -1 and json_end > json_start:
            json_str = response[json_start:json_end]
            quiz = json.loads(json_str)
            return quiz
    except json.JSONDecodeError:
        pass
    
    # Fallback: return raw response in a structured format
    return [{
        "question": "Quiz generation encountered an issue. Raw response:",
        "options": [],
        "correct_answer": response,
        "explanation": "Please try again"
    }]


def generate_question_paper(
    session_id: str,
    topic: str,
    num_questions: int = 10,
    difficulty: str = "medium",
    include_answers: bool = False,
    question_types: Optional[List[str]] = None
) -> dict:
    """
    Generate a formatted question paper for teachers (MCQ only).
    """
    db = load_vector_store(session_id)
    if db is None:
        raise ValueError(f"No vector store found for session: {session_id}")
    
    # Get relevant content
    docs = db.similarity_search(f"{topic} concepts definitions explanations", k=10)
    context = "\n\n".join([doc.page_content for doc in docs])
    
    # Simple MCQ-only prompt
    prompt = f"""You are an expert teacher creating a {difficulty} difficulty MCQ exam on "{topic}".

Based on this content:
{context}

Create exactly {num_questions} multiple choice questions.

Format each question EXACTLY like this:
1. [Question text here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
{"Answer: [Correct letter]" if include_answers else ""}

2. [Next question]
...and so on.

IMPORTANT: Only output the questions. Do not add any notes, explanations, or commentary before or after the questions.

Generate {num_questions} MCQ questions now:"""

    llm = get_llm(temperature=0.4)
    response = llm.invoke(prompt)
    
    # Clean up response - remove any trailing notes/commentary from LLM
    response = clean_llm_response(response)
    
    # Parse the response into structured MCQ format
    questions = parse_mcq_response(response, include_answers)
    
    # Calculate total marks (1 mark per MCQ)
    total_marks = len(questions)
    
    # Calculate duration: 2 minutes per question
    total_minutes = len(questions) * 2
    if total_minutes >= 60:
        hours = total_minutes // 60
        mins = total_minutes % 60
        duration = f"{hours} hour{'s' if hours > 1 else ''}" + (f" {mins} mins" if mins > 0 else "")
    else:
        duration = f"{total_minutes} minutes"
    
    return {
        "title": f"Question Paper - {topic}",
        "instructions": "Choose the correct answer for each question. Each question carries 1 mark.",
        "total_marks": total_marks,
        "duration": duration,
        "sections": [{
            "name": "Multiple Choice Questions",
            "marks_per_question": 1,
            "questions": questions
        }]
    }


def clean_llm_response(response: str) -> str:
    """
    Remove trailing notes/commentary that LLM often adds.
    """
    # Common patterns LLMs add at the end
    stop_patterns = [
        "note that",
        "note:",
        "i have",
        "i've used",
        "please note",
        "the above",
        "these questions",
        "based on the",
        "let me know",
        "hope this helps",
    ]
    
    lines = response.strip().split('\n')
    clean_lines = []
    
    for line in lines:
        line_lower = line.lower().strip()
        # Stop if we hit a trailing note
        if any(line_lower.startswith(pattern) for pattern in stop_patterns):
            break
        clean_lines.append(line)
    
    return '\n'.join(clean_lines).strip()


def parse_mcq_response(response: str, include_answers: bool) -> list:
    """
    Parse MCQ questions from LLM response.
    """
    import re
    
    questions = []
    lines = response.strip().split('\n')
    
    current_question = None
    current_options = []
    question_number = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect question pattern (e.g., "1.", "1)", "Q1:", "Question 1:")
        question_match = re.match(r'^(?:Q(?:uestion)?\s*)?(\d+)[\.\:\)]\s*(.+)', line, re.IGNORECASE)
        
        if question_match:
            # Save previous question
            if current_question and current_options:
                current_question["options"] = current_options
                questions.append(current_question)
            
            question_number = int(question_match.group(1))
            question_text = question_match.group(2).strip()
            current_question = {
                "number": question_number,
                "question": question_text
            }
            current_options = []
            continue
        
        # Detect options (A), B), C), D) or A. B. C. D.
        option_match = re.match(r'^([A-D])[\.\)\:\s]+(.+)', line, re.IGNORECASE)
        if option_match:
            option_letter = option_match.group(1).upper()
            option_text = option_match.group(2).strip()
            current_options.append(f"{option_letter}) {option_text}")
            continue
        
        # Detect answer line
        answer_match = re.match(r'^(?:Answer|Correct Answer|Ans)[\:\s]+([A-D])', line, re.IGNORECASE)
        if answer_match and current_question:
            current_question["answer"] = answer_match.group(1).upper()
            continue
        
        # If line continues question text
        if current_question and not current_options and len(line) > 5:
            current_question["question"] += " " + line
    
    # Don't forget the last question
    if current_question and current_options:
        current_question["options"] = current_options
        questions.append(current_question)
    
    # Fallback if parsing failed
    if not questions:
        questions = [{
            "number": 1,
            "question": response[:500] if len(response) > 500 else response,
            "options": ["A) Option A", "B) Option B", "C) Option C", "D) Option D"]
        }]
    
    return questions


def parse_question_paper_response(response: str, mcq_count: int, short_count: int, long_count: int, include_answers: bool) -> list:
    """
    Parse the LLM response into structured sections.
    """
    sections = []
    
    # Split response into lines for processing
    lines = response.strip().split('\n')
    
    current_section = None
    current_questions = []
    current_question = None
    current_options = []
    question_number = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect section headers
        if 'SECTION A' in line.upper() or 'MULTIPLE CHOICE' in line.upper():
            if current_section and current_questions:
                sections.append(current_section)
            current_section = {
                "name": "Section A - Multiple Choice Questions",
                "marks_per_question": 1,
                "questions": []
            }
            current_questions = []
            question_number = 0
            continue
        elif 'SECTION B' in line.upper() or 'SHORT ANSWER' in line.upper():
            if current_section:
                if current_question:
                    if current_options:
                        current_question["options"] = current_options
                    current_section["questions"].append(current_question)
                sections.append(current_section)
            current_section = {
                "name": "Section B - Short Answer Questions",
                "marks_per_question": 2,
                "questions": []
            }
            current_question = None
            current_options = []
            question_number = 0
            continue
        elif 'SECTION C' in line.upper() or 'LONG ANSWER' in line.upper():
            if current_section:
                if current_question:
                    current_section["questions"].append(current_question)
                sections.append(current_section)
            current_section = {
                "name": "Section C - Long Answer Questions",
                "marks_per_question": 5,
                "questions": []
            }
            current_question = None
            current_options = []
            question_number = 0
            continue
        
        # Detect question patterns (e.g., "1.", "Q1:", "Question 1")
        import re
        question_match = re.match(r'^(?:Q(?:uestion)?\s*)?(\d+)[\.\:\)]\s*(.+)', line, re.IGNORECASE)
        
        if question_match:
            # Save previous question
            if current_question and current_section:
                if current_options:
                    current_question["options"] = current_options
                current_section["questions"].append(current_question)
            
            question_number = int(question_match.group(1))
            question_text = question_match.group(2).strip()
            current_question = {
                "number": question_number,
                "question": question_text
            }
            current_options = []
            continue
        
        # Detect options (A), B), C), D) or A. B. C. D.
        option_match = re.match(r'^([A-D])[\.\)\:]\s*(.+)', line, re.IGNORECASE)
        if option_match and current_question:
            option_letter = option_match.group(1).upper()
            option_text = option_match.group(2).strip()
            current_options.append(f"{option_letter}) {option_text}")
            continue
        
        # Detect answer line
        answer_match = re.match(r'^(?:Answer|Correct Answer|Ans)[\:\s]+(.+)', line, re.IGNORECASE)
        if answer_match and current_question:
            current_question["answer"] = answer_match.group(1).strip()
            continue
        
        # If we have a current question, append to its text
        if current_question and line and not line.startswith(('*', '-', '•')):
            # Could be continuation of question
            if len(current_question.get("question", "")) < 200:
                current_question["question"] = current_question.get("question", "") + " " + line
    
    # Don't forget the last question and section
    if current_question and current_section:
        if current_options:
            current_question["options"] = current_options
        current_section["questions"].append(current_question)
    if current_section:
        sections.append(current_section)
    
    # If parsing failed or got empty sections, create a simple fallback
    if not sections or all(len(s.get("questions", [])) == 0 for s in sections):
        # Return raw response as a single section
        sections = [{
            "name": "Questions",
            "marks_per_question": 2,
            "questions": [{
                "number": 1,
                "question": response[:2000] if len(response) > 2000 else response
            }]
        }]
    
    return sections

