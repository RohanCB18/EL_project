const API_BASE_URL = 'http://localhost:8000';

/**
 * API service for communicating with FastAPI backend
 */
const api = {
  /**
   * Upload a PDF file for processing
   * @param {File} file - PDF file to upload
   * @param {string} userType - 'student' or 'teacher'
   * @returns {Promise<{success: boolean, session_id: string, filename: string}>}
   */
  async uploadPdf(file, userType = 'student') {
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
   * @param {string} sessionId - Session ID from upload
   * @param {string} question - User's question
   * @returns {Promise<{success: boolean, answer: string, sources: string[]}>}
   */
  async askQuestion(sessionId, question) {
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
   * Generate a summary of the uploaded PDF
   * @param {string} sessionId - Session ID from upload
   * @param {number} maxLength - Maximum summary length
   * @returns {Promise<{success: boolean, summary: string}>}
   */
  async getSummary(sessionId, maxLength = 500) {
    const response = await fetch(`${API_BASE_URL}/student/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        max_length: maxLength,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate summary');
    }

    return response.json();
  },

  /**
   * Generate a quiz from the uploaded PDF
   * @param {string} sessionId - Session ID from upload
   * @param {number} numQuestions - Number of questions
   * @param {string} difficulty - Difficulty level
   * @returns {Promise<{success: boolean, quiz: Array}>}
   */
  async generateQuiz(sessionId, numQuestions = 5, difficulty = 'medium') {
    const response = await fetch(`${API_BASE_URL}/student/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        num_questions: numQuestions,
        difficulty: difficulty,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate quiz');
    }

    return response.json();
  },

  /**
   * Generate a question paper for teachers
   * @param {string} sessionId - Session ID from upload
   * @param {Object} options - Question paper options
   * @returns {Promise<{success: boolean, title: string, sections: Array}>}
   */
  async generateQuestionPaper(sessionId, options) {
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
   * @returns {Promise<{status: string}>}
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};

export default api;
