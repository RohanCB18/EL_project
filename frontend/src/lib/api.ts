const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UploadResponse {
    success: boolean;
    session_id: string;
    filename: string;
}

export interface AskResponse {
    success: boolean;
    answer: string;
    sources?: string[];
}

export interface GeneratePaperOptions {
    topic: string;
    numQuestions?: number;
    difficulty?: string;
    includeAnswers?: boolean;
    testMode?: string;
    questionTypes?: string[];
}

export interface QuestionPaper {
    success: boolean;
    title: string;
    total_marks: number;
    duration?: string;
    instructions: string;
    sections: Section[];
}

export interface Section {
    name: string;
    marks_per_question?: number;
    questions: Question[];
}

export interface Question {
    number?: number;
    question: string;
    options?: string[];
    answer?: string;
}

/**
 * API service for communicating with FastAPI backend
 */
const api = {
    /**
     * Upload a PDF file for processing
     */
    async uploadPdf(file: File, userType: string = 'student'): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const endpoint = userType === 'teacher' ? '/teacher/upload' : '/student/upload';

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to upload PDF');
        }

        return response.json();
    },

    /**
     * Ask a question about the uploaded PDF
     */
    async askQuestion(sessionId: string, question: string): Promise<AskResponse> {
        const response = await fetch(`${API_BASE_URL}/student/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                question: question,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to get answer');
        }

        return response.json();
    },

    /**
     * Generate a question paper for teachers
     */
    async generateQuestionPaper(sessionId: string, options: GeneratePaperOptions): Promise<QuestionPaper> {
        const response = await fetch(`${API_BASE_URL}/teacher/generate-paper`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                topic: options.topic,
                num_questions: options.numQuestions || 10,
                difficulty: options.difficulty || 'medium',
                include_answers: options.includeAnswers || false,
                test_mode: options.testMode || 'mcq',
                question_types: options.questionTypes || ['mcq', 'short_answer', 'long_answer'],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate question paper');
        }

        return response.json();
    },

    /**
     * Check backend health
     */
    async healthCheck(): Promise<{ status: string }> {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.json();
    },
};

export default api;
