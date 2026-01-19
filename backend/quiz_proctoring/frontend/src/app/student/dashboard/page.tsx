"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LogOut,
  BookOpen,
  Clock,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import {
  quizApi,
  proctorApi,
  Quiz,
  QuizDetail,
  AnswerResult,
  User,
} from "@/lib/api";
import { getStoredUser, clearStoredUser } from "@/lib/auth";

type ViewState = "list" | "quiz" | "results";

interface ProctorStatus {
  text: string;
  color: string;
}

const STATUS_MAP: Record<string, ProctorStatus> = {
  NORMAL: { text: "NORMAL", color: "bg-accent" },
  SUSPICIOUS: { text: "WARNING", color: "bg-yellow-500" },
  CHEATING: { text: "ALERT", color: "bg-destructive" },
  CALIBRATING: { text: "CALIBRATING", color: "bg-blue-500" },
};

export default function StudentDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewState, setViewState] = useState<ViewState>("list");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Quiz taking state
  const [currentQuiz, setCurrentQuiz] = useState<QuizDetail | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null); // Ref for interval closures
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [isQuizActive, setIsQuizActive] = useState(false);

  // Results state
  const [quizResults, setQuizResults] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    answers: AnswerResult[];
  } | null>(null);

  // Refs for proctoring
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [proctorStatus, setProctorStatus] = useState<ProctorStatus>(
    STATUS_MAP.NORMAL,
  );

  // Keep sessionIdRef in sync with sessionId state
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/auth/student");
      return;
    }
    setCurrentUser(user);
    loadQuizzes(user.email);
  }, [router]);

  const loadQuizzes = async (email: string) => {
    try {
      const data = await quizApi.list(email);
      setQuizzes(data.quizzes);
    } catch (error) {
      console.error("Error loading quizzes:", error);
      showWarning("Failed to load quizzes");
    }
  };

  const logout = () => {
    clearStoredUser();
    router.push("/");
  };

  const showWarning = (message: string) => {
    setWarningMessage(message);
    setTimeout(() => setWarningMessage(null), 5000);
  };

  const submitQuiz = useCallback(
    async (autoSubmit = false) => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const answers = Object.entries(selectedAnswers).map(([qId, answer]) => ({
        question_id: parseInt(qId),
        selected_answer: answer,
      }));

      try {
        const result = await quizApi.submit(
          currentAttemptId!,
          answers,
          autoSubmit,
        );
        await stopProctoring();
        setQuizResults({
          score: result.score,
          correctAnswers: result.correct_answers,
          totalQuestions: result.total_questions,
          answers: result.answers,
        });
        setViewState("results");
      } catch (error) {
        console.error("Error submitting quiz:", error);
        alert(
          "Failed to submit quiz: " +
            (error instanceof Error ? error.message : "Unknown error"),
        );
      }
    },
    [selectedAnswers, currentAttemptId],
  );

  const handleFullscreenChange = useCallback(() => {
    if (!isQuizActive) return;
    if (!document.fullscreenElement) {
      logBrowserEvent("EXIT_FULLSCREEN", "Fullscreen exited");
      showWarning("⚠ Fullscreen exit detected - Quiz will be auto-submitted");
      setTimeout(() => submitQuiz(true), 2000);
    }
  }, [isQuizActive, submitQuiz]);

  const handleVisibilityChange = useCallback(() => {
    if (!isQuizActive) return;
    if (document.hidden) {
      logBrowserEvent("TAB_SWITCH", "Tab switched");
      showWarning("⚠ Tab switch detected - Quiz will be auto-submitted");
      setTimeout(() => submitQuiz(true), 2000);
    }
  }, [isQuizActive, submitQuiz]);

  const handleWindowBlur = useCallback(() => {
    if (!isQuizActive) return;
    logBrowserEvent("WINDOW_BLUR", "Window lost focus");
    showWarning("⚠ Window blur detected - Quiz will be auto-submitted");
    setTimeout(() => submitQuiz(true), 2000);
  }, [isQuizActive, submitQuiz]);

  const logBrowserEvent = async (event: string, message: string) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;
    try {
      console.log("Logging browser event:", event, message);
      await proctorApi.browserEvent(
        currentSessionId,
        event,
        "HIGH",
        new Date().toISOString(),
      );
    } catch (error) {
      console.error("Browser event log error:", error);
    }
  };

  const startQuiz = async (quizId: string) => {
    if (!currentUser) return;

    try {
      const data = await quizApi.startAttempt(currentUser.email, quizId);
      setCurrentAttemptId(data.attempt_id);
      setCurrentQuiz(data.quiz);
      setSessionId(data.session_id);
      setTimeRemaining(data.quiz.time_limit);
      setSelectedAnswers({});
      setViewState("quiz");

      startTimer(data.quiz.time_limit);
      await startProctoring();
      await enterFullscreen();
      activateBrowserSecurity();
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert(
        "Failed to start quiz: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const startTimer = (initialTime: number) => {
    let remaining = initialTime;
    timerIntervalRef.current = setInterval(() => {
      remaining--;
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        submitQuiz(true);
      }
    }, 1000);
  };

  const startProctoring = async () => {
    try {
      console.log("Starting proctoring...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });
      }
      console.log("Camera started, beginning frame processing...");

      processingIntervalRef.current = setInterval(processFrame, 1000);
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 2000);
    } catch (error) {
      console.error("Proctoring error:", error);
      showWarning("Failed to start camera for proctoring");
    }
  };

  const stopProctoring = async () => {
    console.log("Stopping proctoring...");
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    deactivateBrowserSecurity();
    exitFullscreen();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const processFrame = async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || !streamRef.current || !videoRef.current) {
      console.log("Skipping frame - missing:", {
        sessionId: !!currentSessionId,
        stream: !!streamRef.current,
        video: !!videoRef.current,
      });
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;

      if (canvas.width === 0 || canvas.height === 0) {
        console.log(
          "Video not ready yet, dimensions:",
          canvas.width,
          canvas.height,
        );
        return;
      }

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const frameBase64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

        console.log("Sending frame to proctor API, session:", currentSessionId);
        const result = await proctorApi.sendFrame(
          currentSessionId,
          frameBase64,
        );
        console.log("Proctor response:", result);
        updateProctorStatus(result.event);
      }
    } catch (error) {
      console.error("Frame processing error:", error);
    }
  };

  const updateProctorStatus = (event: string | null) => {
    const status =
      event && STATUS_MAP[event] ? STATUS_MAP[event] : STATUS_MAP.CALIBRATING;
    setProctorStatus(status);
  };

  const sendHeartbeat = async () => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;
    try {
      await proctorApi.heartbeat(currentSessionId, new Date().toISOString());
    } catch (error) {
      console.error("Heartbeat error:", error);
    }
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const activateBrowserSecurity = () => {
    setIsQuizActive(true);
  };

  useEffect(() => {
    if (isQuizActive) {
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleWindowBlur);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [
    isQuizActive,
    handleFullscreenChange,
    handleVisibilityChange,
    handleWindowBlur,
  ]);

  const deactivateBrowserSecurity = () => {
    setIsQuizActive(false);
  };

  const selectOption = (questionId: number, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const backToList = () => {
    setViewState("list");
    setQuizResults(null);
    if (currentUser) {
      loadQuizzes(currentUser.email);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="glass shadow-xl rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <div>
              <CardTitle className="text-3xl font-black tracking-tight text-foreground">
                Student Dashboard
              </CardTitle>
              <p className="text-muted-foreground font-medium mt-1">
                {currentUser.email}
              </p>
            </div>
            <Button variant="destructive" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </CardHeader>

          <CardContent className="pt-6">
            {warningMessage && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6 text-center font-medium flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {warningMessage}
              </div>
            )}

            {/* Quiz List View */}
            {viewState === "list" && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-foreground">
                  Available Quizzes
                </h2>
                {quizzes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No quizzes available yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                      <Card
                        key={quiz.quiz_id}
                        className="bg-card border border-border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold mb-4 text-foreground">
                            {quiz.title}
                          </h3>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              Subject: {quiz.subject.toUpperCase()}
                            </p>
                            <p className="flex items-center gap-2">
                              <HelpCircle className="w-4 h-4" />
                              Questions: {quiz.question_count}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Time: {Math.floor(quiz.time_limit / 60)} minutes
                            </p>
                          </div>
                          <Badge
                            variant={quiz.attempted ? "default" : "secondary"}
                            className={`mt-4 ${quiz.attempted ? "bg-accent text-accent-foreground" : ""}`}
                          >
                            {quiz.attempted ? "Already Attempted" : "Available"}
                          </Badge>
                          <Button
                            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => startQuiz(quiz.quiz_id)}
                            disabled={quiz.attempted}
                          >
                            {quiz.attempted ? "Completed" : "Start Quiz"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quiz Taking View */}
            {viewState === "quiz" && currentQuiz && (
              <div>
                <div className="bg-primary text-primary-foreground p-6 rounded-xl mb-6">
                  <h2 className="text-2xl font-bold">{currentQuiz.title}</h2>
                  <p>Subject: {currentQuiz.subject.toUpperCase()}</p>
                </div>

                <div className="text-center text-2xl font-semibold p-4 bg-card border border-border rounded-lg mb-6 text-foreground">
                  Time Remaining: {formatTime(timeRemaining)}
                </div>

                <ScrollArea className="h-[calc(100vh-400px)]">
                  <div className="bg-muted p-6 rounded-xl space-y-6">
                    {currentQuiz.questions.map((q, index) => (
                      <div
                        key={q.id}
                        className="bg-card p-6 rounded-xl border border-border shadow-sm"
                      >
                        <p className="text-lg font-semibold text-foreground mb-4">
                          Q{index + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, i) => {
                            const optionLetter = String.fromCharCode(65 + i);
                            const isSelected =
                              selectedAnswers[q.id] === optionLetter;
                            return (
                              <label
                                key={i}
                                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? "bg-primary/5 border-primary shadow-sm"
                                    : "bg-muted border-border hover:bg-card hover:border-primary/50"
                                }`}
                                onClick={() => selectOption(q.id, optionLetter)}
                              >
                                <input
                                  type="radio"
                                  name={`q${q.id}`}
                                  value={optionLetter}
                                  checked={isSelected}
                                  onChange={() =>
                                    selectOption(q.id, optionLetter)
                                  }
                                  className="mr-3"
                                />
                                <span className="text-foreground">
                                  {optionLetter}. {opt}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Button
                  className="w-full mt-6 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => submitQuiz(false)}
                >
                  Submit Quiz
                </Button>

                {/* Video Section */}
                <div className="fixed bottom-6 right-6 w-64 rounded-xl overflow-hidden shadow-2xl border border-border z-50">
                  <div
                    className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white uppercase tracking-wider ${proctorStatus.color}`}
                  >
                    {proctorStatus.text}
                  </div>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Results View */}
            {viewState === "results" && quizResults && (
              <div>
                <div className="text-center p-12 bg-gradient-to-br from-primary to-accent text-white rounded-2xl mb-8 shadow-lg">
                  <h2 className="text-5xl font-black mb-2">
                    {quizResults.score.toFixed(1)}%
                  </h2>
                  <p className="text-lg opacity-90">
                    You got {quizResults.correctAnswers} out of{" "}
                    {quizResults.totalQuestions} questions correct
                  </p>
                </div>

                <h3 className="text-xl font-bold mb-4 text-foreground">
                  Answer Review
                </h3>
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-4">
                    {quizResults.answers.map((ans, index) => (
                      <div
                        key={index}
                        className={`p-6 rounded-xl border ${
                          ans.is_correct
                            ? "border-l-4 border-l-accent bg-accent/5"
                            : "border-l-4 border-l-destructive bg-destructive/5"
                        }`}
                      >
                        <h4 className="font-semibold text-foreground mb-2">
                          Q{index + 1}. {ans.question}
                        </h4>
                        <p className="text-muted-foreground">
                          <strong>Your Answer:</strong> {ans.selected_answer}
                        </p>
                        <p className="text-muted-foreground">
                          <strong>Correct Answer:</strong> {ans.correct_answer}
                        </p>
                        <p
                          className={`font-bold mt-2 ${
                            ans.is_correct ? "text-accent" : "text-destructive"
                          }`}
                        >
                          {ans.is_correct ? "✓ Correct" : "✗ Incorrect"}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Button
                  variant="secondary"
                  className="mt-6 h-12"
                  onClick={backToList}
                >
                  Back to Quiz List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
