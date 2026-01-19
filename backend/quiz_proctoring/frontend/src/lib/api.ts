// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// API Helper Functions
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Request failed");
  }

  return data;
}

// Auth API
export const authApi = {
  studentLogin: (email: string, password: string) =>
    apiRequest<AuthResponse>("/auth/student/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  studentRegister: (email: string, password: string) =>
    apiRequest<AuthResponse>("/auth/student/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  teacherLogin: (email: string, password: string) =>
    apiRequest<AuthResponse>("/auth/teacher/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  teacherRegister: (email: string, password: string, subject: string) =>
    apiRequest<AuthResponse>("/auth/teacher/register", {
      method: "POST",
      body: JSON.stringify({ email, password, subject }),
    }),
};

// Quiz API
export const quizApi = {
  list: (studentEmail?: string) =>
    apiRequest<QuizListResponse>(
      studentEmail ? `/quiz/list?student_email=${studentEmail}` : "/quiz/list",
    ),

  getQuestions: (subject: string) =>
    apiRequest<QuestionsResponse>(`/quiz/questions/${subject}`),

  create: (teacherEmail: string, quizData: CreateQuizRequest) =>
    apiRequest<CreateQuizResponse>(
      `/quiz/create?teacher_email=${teacherEmail}`,
      {
        method: "POST",
        body: JSON.stringify(quizData),
      },
    ),

  startAttempt: (studentEmail: string, quizId: string) =>
    apiRequest<StartAttemptResponse>("/quiz/start-attempt", {
      method: "POST",
      body: JSON.stringify({ student_email: studentEmail, quiz_id: quizId }),
    }),

  submit: (
    attemptId: string,
    answers: AnswerSubmission[],
    autoSubmitted: boolean,
  ) =>
    apiRequest<QuizResultResponse>("/quiz/submit", {
      method: "POST",
      body: JSON.stringify({
        attempt_id: attemptId,
        answers,
        auto_submitted: autoSubmitted,
      }),
    }),

  getAttempts: (quizId: string, teacherEmail: string) =>
    apiRequest<AttemptsResponse>(
      `/quiz/${quizId}/attempts?teacher_email=${teacherEmail}`,
    ),
};

// Proctor API
export const proctorApi = {
  sendFrame: async (
    sessionId: string,
    frameBase64: string,
  ): Promise<ProctorFrameResponse> => {
    const response = await fetch(`${API_BASE_URL}/proctor/frame`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        frame_base64: frameBase64,
      }),
    });

    const data = await response.json();

    // Handle null event by defaulting to CALIBRATING
    return {
      event: data.event || "CALIBRATING",
    };
  },

  heartbeat: (sessionId: string, timestamp: string) =>
    apiRequest<void>("/proctor/heartbeat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, timestamp }),
    }),

  browserEvent: (
    sessionId: string,
    event: string,
    severity: string,
    timestamp: string,
  ) =>
    apiRequest<void>("/proctor/browser-event", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        event,
        severity,
        timestamp,
      }),
    }),

  getEvidence: (sessionId: string) =>
    apiRequest<EvidenceResponse>(`/proctor/evidence/${sessionId}`),
};

// Type Definitions
export interface User {
  email: string;
  subject?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface Quiz {
  quiz_id: string;
  title: string;
  subject: string;
  question_count: number;
  time_limit: number;
  attempted?: boolean;
  teacher_email?: string;
  created_at?: string;
}

export interface QuizListResponse {
  quizzes: Quiz[];
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  is_custom?: boolean;
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface CreateQuizRequest {
  title: string;
  subject: string;
  questions: Omit<Question, "id">[];
}

export interface CreateQuizResponse {
  quiz_id: string;
  message: string;
}

export interface QuizDetail {
  title: string;
  subject: string;
  time_limit: number;
  questions: Question[];
}

export interface StartAttemptResponse {
  attempt_id: string;
  quiz: QuizDetail;
  session_id: string;
}

export interface AnswerSubmission {
  question_id: number;
  selected_answer: string;
}

export interface AnswerResult {
  question: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface QuizResultResponse {
  score: number;
  correct_answers: number;
  total_questions: number;
  answers: AnswerResult[];
}

export interface Violation {
  type: string;
  reason: string;
  confidence: number;
  timestamp: string;
}

export interface Attempt {
  student_email: string;
  end_time: string;
  score: number;
  auto_submitted: boolean;
  violations: Violation[];
  session_id?: string;
}

export interface AttemptsResponse {
  attempts: Attempt[];
}

export interface ProctorFrameResponse {
  event: "NORMAL" | "SUSPICIOUS" | "CHEATING" | "CALIBRATING" | null;
}

export interface EvidenceItem {
  image_base64: string;
  confidence: number;
  reason: string;
  event_type: string;
  timestamp: string;
}

export interface EvidenceResponse {
  session_id: string;
  total_evidences: number;
  evidences: EvidenceItem[];
}
