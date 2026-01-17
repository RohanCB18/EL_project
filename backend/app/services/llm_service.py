from typing import List, Optional
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.schema import Document
from app.config import settings
from app.services.vector_store import similarity_search, load_vector_store
import json


def get_llm(temperature: float = 0):
    """Get OpenRouter LLM instance (OpenAI-compatible)."""
    return ChatOpenAI(
        model=settings.OPENROUTER_MODEL,
        api_key=settings.OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
        temperature=temperature
    )


def get_qa_chain():
    """
    Get the RAG-based question answering chain.
    Uses a strict prompt to only answer from provided context.
    """
    prompt_template = """
    You are an AI assistant answering questions based on the provided PDF content.

    Rules you MUST follow:
    1. Use ONLY the information present in the given context.
    2. DO NOT use any external knowledge.
    3. DO NOT guess or assume missing information.
    4. If the answer is NOT present in the context, reply exactly:
       "The answer is not available in the provided PDF."
    5. Provide COMPREHENSIVE and DETAILED answers.
    6. If the question asks about multiple items (e.g., types, methods, categories), explain ALL of them in detail, not just the first one.
    7. Use bullet points or numbered lists for clarity when explaining multiple concepts.

    Context:
    {context}

    Question:
    {question}

    Provide a comprehensive answer covering all relevant points from the PDF:
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
    # Get relevant chunks - increased k for more comprehensive answers
    relevant_chunks = similarity_search(session_id, question, k=12)
    
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
    docs = db.similarity_search("main topic summary overview", k=10)
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
    response = llm.invoke(prompt)
    
    return response.content


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
    docs = db.similarity_search("key concepts important facts definitions", k=12)
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
    response = llm.invoke(prompt).content
    
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
    test_mode: str = "mcq",
    question_types: Optional[List[str]] = None
) -> dict:
    """
    Generate a formatted question paper for teachers.
    
    Test modes:
    - mcq: Only MCQs (1 mark each)
    - theory: Short answers (2 marks) + Long answers (5 marks)
    - hybrid: MCQs (1 mark) + Short (2 marks) + Long (5 marks)
    """
    db = load_vector_store(session_id)
    if db is None:
        raise ValueError(f"No vector store found for session: {session_id}")
    
    # Get relevant content (increased k for more comprehensive coverage)
    docs = db.similarity_search(f"{topic} concepts definitions explanations", k=20)
    context = "\n\n".join([doc.page_content for doc in docs])
    
    sections = []
    total_marks = 0
    
    if test_mode == "mcq":
        # All MCQs - 1 mark each
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

IMPORTANT: Start directly with question 1. No introductions, no markdown formatting (like ** or __), no explanations or commentary.

Generate {num_questions} MCQ questions now:"""
        
        llm = get_llm(temperature=0.4)
        response = llm.invoke(prompt).content
        response = clean_llm_response(response)
        questions = parse_mcq_response(response, include_answers)
        
        sections = [{
            "name": "Section A: Multiple Choice Questions",
            "marks_per_question": 1,
            "questions": questions
        }]
        total_marks = len(questions) * 1
        instructions = "Choose the correct answer for each question. Each question carries 1 mark."
        
    elif test_mode == "theory":
        # Short (2 marks) + Long (5 marks) answers
        num_short = max(1, num_questions // 2)
        num_long = max(1, num_questions - num_short)
        
        # Generate short answer questions
        short_prompt = f"""You are an expert teacher creating {difficulty} difficulty short answer questions on "{topic}".

Based on this content:
{context}

Create exactly {num_short} short answer questions (2 marks each).
These should be questions that can be answered in 2-3 lines or a brief explanation.

Format:
1. [Question text]
{"Answer: [Brief 2-3 line answer]" if include_answers else ""}

2. [Next question]
...

IMPORTANT: Start directly with question 1. No introductions, no markdown formatting (like ** or __), no commentary.

Generate {num_short} short answer questions now:"""

        llm = get_llm(temperature=0.4)
        short_response = llm.invoke(short_prompt).content
        short_response = clean_llm_response(short_response)
        short_questions = parse_theory_response(short_response, include_answers)
        
        # Generate long answer questions
        long_prompt = f"""You are an expert teacher creating {difficulty} difficulty long answer questions on "{topic}".

Based on this content:
{context}

Create exactly {num_long} long answer questions (5 marks each).
These should be questions requiring detailed explanations, comparisons, or comprehensive answers.

Format:
1. [Question text - should require a paragraph or detailed explanation]
{"Answer: [Detailed answer]" if include_answers else ""}

2. [Next question]
...

IMPORTANT: Start directly with question 1. No introductions, no markdown formatting (like ** or __), no commentary.

Generate {num_long} long answer questions now:"""

        long_response = llm.invoke(long_prompt).content
        long_response = clean_llm_response(long_response)
        long_questions = parse_theory_response(long_response, include_answers)
        
        sections = [
            {
                "name": "Section A: Short Answer Questions (2 Marks Each)",
                "marks_per_question": 2,
                "questions": short_questions
            },
            {
                "name": "Section B: Long Answer Questions (5 Marks Each)",
                "marks_per_question": 5,
                "questions": long_questions
            }
        ]
        total_marks = (len(short_questions) * 2) + (len(long_questions) * 5)
        instructions = "Answer all questions. Section A carries 2 marks each. Section B carries 5 marks each."
        
    else:  # hybrid mode
        # MCQ (1 mark) + Short (2 marks) + Long (5 marks)
        num_mcq = max(1, num_questions // 3)
        num_short = max(1, num_questions // 3)
        num_long = max(1, num_questions - num_mcq - num_short)
        
        # MCQ questions
        mcq_prompt = f"""You are an expert teacher creating {difficulty} difficulty MCQ questions on "{topic}".

Based on this content:
{context}

Create exactly {num_mcq} multiple choice questions.

Format:
1. [Question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
{"Answer: [Correct letter]" if include_answers else ""}

IMPORTANT: Start directly with question 1. No introductions, no markdown formatting (like ** or __), no commentary.

Generate {num_mcq} MCQ questions now:"""

        llm = get_llm(temperature=0.4)
        mcq_response = llm.invoke(mcq_prompt).content
        mcq_response = clean_llm_response(mcq_response)
        mcq_questions = parse_mcq_response(mcq_response, include_answers)
        
        # Short answer questions
        short_prompt = f"""Create exactly {num_short} short answer questions (2 marks each) on "{topic}".

Based on this content:
{context}

Format:
1. [Question requiring 2-3 line answer]
{"Answer: [Brief answer]" if include_answers else ""}

IMPORTANT: Start directly with question 1. No introductions, no markdown formatting (like ** or __), no commentary.

Generate {num_short} short answer questions now:"""

        short_response = llm.invoke(short_prompt).content
        short_response = clean_llm_response(short_response)
        short_questions = parse_theory_response(short_response, include_answers)
        
        # Long answer questions  
        long_prompt = f"""Create exactly {num_long} long answer questions (5 marks each) on "{topic}".

Based on this content:
{context}

IMPORTANT: Start directly with question 1. No introductions. No markdown formatting.

Format:
1. [Question requiring detailed explanation]
{"Answer: [Detailed answer]" if include_answers else ""}

2. [Next question]
...

Generate {num_long} long answer questions now:"""

        long_response = llm.invoke(long_prompt).content
        long_response = clean_llm_response(long_response)
        long_questions = parse_theory_response(long_response, include_answers)
        
        sections = [
            {
                "name": "Section A: Multiple Choice Questions (1 Mark Each)",
                "marks_per_question": 1,
                "questions": mcq_questions
            },
            {
                "name": "Section B: Short Answer Questions (2 Marks Each)",
                "marks_per_question": 2,
                "questions": short_questions
            },
            {
                "name": "Section C: Long Answer Questions (5 Marks Each)",
                "marks_per_question": 5,
                "questions": long_questions
            }
        ]
        total_marks = (len(mcq_questions) * 1) + (len(short_questions) * 2) + (len(long_questions) * 5)
        instructions = "Answer all questions. Section A: 1 mark each, Section B: 2 marks each, Section C: 5 marks each."
    
    # Recalculate total marks from sections to ensure accuracy
    total_marks = 0
    for section in sections:
        marks_per_q = section.get("marks_per_question", 1)
        num_qs = len(section.get("questions", []))
        total_marks += marks_per_q * num_qs
    
    # Calculate duration: 2 minutes per mark
    total_minutes = total_marks * 2
    if total_minutes >= 60:
        hours = total_minutes // 60
        mins = total_minutes % 60
        duration = f"{hours} hour{'s' if hours > 1 else ''}" + (f" {mins} mins" if mins > 0 else "")
    else:
        duration = f"{total_minutes} minutes"
    
    return {
        "title": f"Question Paper - {topic}",
        "instructions": instructions,
        "total_marks": total_marks,
        "duration": duration,
        "sections": sections
    }


def clean_llm_response(response: str) -> str:
    """
    Remove trailing notes/commentary and markdown formatting that LLM often adds.
    """
    # Remove markdown bold/italic formatting
    response = response.replace('**', '')
    response = response.replace('__', '')
    
    # Common patterns LLMs add at the start (intro text to skip)
    skip_start_patterns = [
        "here are",
        "here is",
        "okay,",
        "sure,",
        "below are",
        "i'll create",
        "i will create",
    ]
    
    # Common patterns LLMs add at the end (notes to stop at)
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
        "this question assesses",
        "this tests",
    ]
    
    lines = response.strip().split('\n')
    clean_lines = []
    started = False
    
    for line in lines:
        line_lower = line.lower().strip()
        
        # Skip intro lines at the start
        if not started:
            if any(line_lower.startswith(pattern) for pattern in skip_start_patterns):
                continue
            # Check if this line starts a question (number pattern)
            if line_lower and (line_lower[0].isdigit() or line_lower.startswith('q')):
                started = True
        
        # Stop if we hit a trailing note
        if started and any(line_lower.startswith(pattern) for pattern in stop_patterns):
            break
            
        if started or (line_lower and line_lower[0].isdigit()):
            started = True
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


def parse_theory_response(response: str, include_answers: bool) -> list:
    """
    Parse theory (short/long answer) questions from LLM response.
    """
    import re
    
    questions = []
    lines = response.strip().split('\n')
    
    current_question = None
    current_answer = []
    question_number = 0
    in_answer = False
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Detect question pattern (e.g., "1.", "1)", "Q1:")
        question_match = re.match(r'^(?:Q(?:uestion)?\.?\s*)?(\d+)[.\)]\s*(.+)', line, re.IGNORECASE)
        
        if question_match:
            # Save previous question
            if current_question:
                if in_answer and current_answer:
                    current_question["answer"] = ' '.join(current_answer)
                questions.append(current_question)
            
            question_number = int(question_match.group(1))
            question_text = question_match.group(2).strip()
            current_question = {
                "number": question_number,
                "question": question_text
            }
            current_answer = []
            in_answer = False
            continue
        
        # Detect answer line
        answer_match = re.match(r'^(?:Answer|Ans)[:\s]+(.+)', line, re.IGNORECASE)
        if answer_match and current_question:
            in_answer = True
            current_answer.append(answer_match.group(1).strip())
            continue
        
        # If we're collecting answer text
        if in_answer and current_question:
            current_answer.append(line)
            continue
        
        # Continue question text
        if current_question and not in_answer:
            current_question["question"] += " " + line
    
    # Don't forget the last question
    if current_question:
        if in_answer and current_answer:
            current_question["answer"] = ' '.join(current_answer)
        questions.append(current_question)
    
    # Fallback if parsing failed
    if not questions:
        questions = [{
            "number": 1,
            "question": response[:500] if len(response) > 500 else response
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

