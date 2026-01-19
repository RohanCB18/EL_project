"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LogOut,
  BookOpen,
  Clock,
  HelpCircle,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Image,
  X,
  ZoomIn,
} from "lucide-react";
import {
  quizApi,
  proctorApi,
  Quiz,
  Question,
  Attempt,
  User,
  EvidenceItem,
} from "@/lib/api";
import { getStoredUser, clearStoredUser } from "@/lib/auth";

export default function TeacherDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Create Quiz state
  const [quizTitle, setQuizTitle] = useState("");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestionIndices, setSelectedQuestionIndices] = useState<
    number[]
  >([]);
  const [customQuestions, setCustomQuestions] = useState<
    Omit<Question, "id">[]
  >([]);
  const [showQuestionsBank, setShowQuestionsBank] = useState(false);

  // Custom question form
  const [customQuestion, setCustomQuestion] = useState("");
  const [customOptionA, setCustomOptionA] = useState("");
  const [customOptionB, setCustomOptionB] = useState("");
  const [customOptionC, setCustomOptionC] = useState("");
  const [customOptionD, setCustomOptionD] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");

  // Review Quiz state
  const [teacherQuizzes, setTeacherQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Evidence viewing state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [currentEvidence, setCurrentEvidence] = useState<EvidenceItem[]>([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<EvidenceItem | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/auth/teacher");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  const logout = () => {
    clearStoredUser();
    router.push("/");
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadQuestions = async () => {
    if (!currentUser?.subject) return;

    try {
      const data = await quizApi.getQuestions(currentUser.subject);
      setAllQuestions(data.questions);
      setShowQuestionsBank(true);
      showMessage("Questions loaded successfully!", "success");
    } catch (error) {
      showMessage("Failed to load questions", "error");
    }
  };

  const toggleQuestion = (index: number) => {
    setSelectedQuestionIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  const addCustomQuestion = () => {
    if (
      !customQuestion ||
      !customOptionA ||
      !customOptionB ||
      !customOptionC ||
      !customOptionD ||
      !customAnswer
    ) {
      alert("Please fill all fields");
      return;
    }

    const answer = customAnswer.toUpperCase();
    if (!["A", "B", "C", "D"].includes(answer)) {
      alert("Answer must be A, B, C, or D");
      return;
    }

    setCustomQuestions((prev) => [
      ...prev,
      {
        question: customQuestion,
        options: [customOptionA, customOptionB, customOptionC, customOptionD],
        answer,
        is_custom: true,
      },
    ]);

    // Clear form
    setCustomQuestion("");
    setCustomOptionA("");
    setCustomOptionB("");
    setCustomOptionC("");
    setCustomOptionD("");
    setCustomAnswer("");

    showMessage("Custom question added!", "success");
  };

  const createQuiz = async () => {
    if (!currentUser) return;

    if (!quizTitle) {
      alert("Please enter quiz title");
      return;
    }

    const totalQuestions =
      selectedQuestionIndices.length + customQuestions.length;
    if (totalQuestions === 0) {
      alert("Please select at least one question");
      return;
    }

    const questions = [
      ...selectedQuestionIndices.map((i) => ({
        question: allQuestions[i].question,
        options: allQuestions[i].options,
        answer: allQuestions[i].answer,
        is_custom: false,
      })),
      ...customQuestions,
    ];

    try {
      await quizApi.create(currentUser.email, {
        title: quizTitle,
        subject: currentUser.subject!,
        questions,
      });

      showMessage("Quiz created successfully!", "success");
      setSelectedQuestionIndices([]);
      setCustomQuestions([]);
      setQuizTitle("");
      setShowQuestionsBank(false);
    } catch (error) {
      showMessage("Error creating quiz", "error");
    }
  };

  const loadTeacherQuizzes = async () => {
    if (!currentUser) return;

    try {
      const data = await quizApi.list();
      const filtered = data.quizzes.filter(
        (q) =>
          q.subject === currentUser.subject &&
          q.teacher_email === currentUser.email,
      );
      setTeacherQuizzes(filtered);
    } catch (error) {
      showMessage("Failed to load quizzes", "error");
    }
  };

  const viewAttempts = async (quizId: string, quizTitle: string) => {
    if (!currentUser) return;

    try {
      const data = await quizApi.getAttempts(quizId, currentUser.email);
      setSelectedQuiz({ id: quizId, title: quizTitle });
      setAttempts(data.attempts);
    } catch (error) {
      showMessage("Failed to load attempts", "error");
    }
  };

  const backToQuizList = () => {
    setSelectedQuiz(null);
    setAttempts([]);
  };

  const viewEvidence = async (sessionId: string) => {
    if (!sessionId) {
      showMessage("No session ID available for this attempt", "error");
      return;
    }

    setEvidenceLoading(true);
    setEvidenceModalOpen(true);
    setSelectedImage(null);

    try {
      const data = await proctorApi.getEvidence(sessionId);
      // Filter to only include items that have images
      const evidencesWithImages = data.evidences.filter(
        (e) => e.image_base64 && e.image_base64.length > 0,
      );
      setCurrentEvidence(evidencesWithImages);
    } catch (error) {
      console.error("Evidence fetch error:", error);
      showMessage("Failed to load evidence images", "error");
      setCurrentEvidence([]);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const closeEvidenceModal = () => {
    setEvidenceModalOpen(false);
    setCurrentEvidence([]);
    setSelectedImage(null);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toUpperCase()) {
      case "CHEATING":
        return "bg-destructive text-white";
      case "SUSPICIOUS":
        return "bg-yellow-500 text-white";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 70) return "bg-accent";
    if (score >= 40) return "bg-yellow-500";
    return "bg-destructive";
  };

  const totalSelectedCount =
    selectedQuestionIndices.length + customQuestions.length;

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
                Teacher Dashboard
              </CardTitle>
              <p className="text-muted-foreground font-medium mt-1">
                {currentUser.email} | Subject:{" "}
                {currentUser.subject?.toUpperCase()}
              </p>
            </div>
            <Button variant="destructive" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs
              defaultValue="create"
              className="w-full"
              onValueChange={(v) => v === "review" && loadTeacherQuizzes()}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-1 rounded-lg">
                <TabsTrigger
                  value="create"
                  className="rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Create Quiz
                </TabsTrigger>
                <TabsTrigger
                  value="review"
                  className="rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Review Quizzes
                </TabsTrigger>
              </TabsList>

              {message && (
                <div
                  className={`p-3 rounded-lg mb-4 text-center font-medium ${
                    message.type === "error"
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-accent/10 text-accent border border-accent/20"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Create Quiz Tab */}
              <TabsContent value="create" className="mt-0">
                <div className="bg-muted p-6 rounded-xl mb-6">
                  <h2 className="text-2xl font-bold mb-6 text-foreground">
                    Create New Quiz
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium uppercase tracking-wider text-foreground">
                        Quiz Title
                      </label>
                      <Input
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="Enter quiz title"
                        className="h-12 bg-background border-border"
                      />
                    </div>

                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={loadQuestions}
                    >
                      Load Questions from Subject
                    </Button>
                  </div>

                  {showQuestionsBank && (
                    <div className="mt-6 bg-card p-6 rounded-xl border border-border">
                      <h3 className="text-xl font-bold mb-4 text-foreground">
                        Select Questions
                      </h3>
                      <Badge className="bg-primary text-primary-foreground mb-4">
                        Selected: {totalSelectedCount} questions
                      </Badge>

                      <ScrollArea className="h-80">
                        <div className="space-y-3">
                          {allQuestions.map((q, index) => (
                            <div
                              key={index}
                              onClick={() => toggleQuestion(index)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                                selectedQuestionIndices.includes(index)
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {selectedQuestionIndices.includes(index) && (
                                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground">
                                    {q.question}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {q.options
                                      .map(
                                        (opt, i) =>
                                          `${String.fromCharCode(65 + i)}. ${opt}`,
                                      )
                                      .join(" | ")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Custom Question Section */}
                  <div className="mt-6 bg-card/50 p-6 rounded-xl border border-border">
                    <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add Custom Question
                    </h3>
                    <div className="space-y-3">
                      <Input
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="Question text"
                        className="bg-background border-border"
                      />
                      <Input
                        value={customOptionA}
                        onChange={(e) => setCustomOptionA(e.target.value)}
                        placeholder="Option A"
                        className="bg-background border-border"
                      />
                      <Input
                        value={customOptionB}
                        onChange={(e) => setCustomOptionB(e.target.value)}
                        placeholder="Option B"
                        className="bg-background border-border"
                      />
                      <Input
                        value={customOptionC}
                        onChange={(e) => setCustomOptionC(e.target.value)}
                        placeholder="Option C"
                        className="bg-background border-border"
                      />
                      <Input
                        value={customOptionD}
                        onChange={(e) => setCustomOptionD(e.target.value)}
                        placeholder="Option D"
                        className="bg-background border-border"
                      />
                      <Input
                        value={customAnswer}
                        onChange={(e) => setCustomAnswer(e.target.value)}
                        placeholder="Correct Answer (A, B, C, or D)"
                        className="bg-background border-border"
                      />
                      <Button variant="secondary" onClick={addCustomQuestion}>
                        Add Custom Question
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6 h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={createQuiz}
                  >
                    Create Quiz
                  </Button>
                </div>
              </TabsContent>

              {/* Review Quizzes Tab */}
              <TabsContent value="review" className="mt-0">
                {!selectedQuiz ? (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 text-foreground">
                      Your Quizzes
                    </h2>
                    {teacherQuizzes.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No quizzes created yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teacherQuizzes.map((quiz) => (
                          <Card
                            key={quiz.quiz_id}
                            className="bg-card border border-border hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                            onClick={() =>
                              viewAttempts(quiz.quiz_id, quiz.title)
                            }
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
                                  Time: {Math.floor(quiz.time_limit / 60)}{" "}
                                  minutes
                                </p>
                                <p className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Created:{" "}
                                  {quiz.created_at
                                    ? new Date(
                                        quiz.created_at,
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="secondary"
                      className="mb-6 gap-2"
                      onClick={backToQuizList}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Quiz List
                    </Button>

                    <h2 className="text-2xl font-bold mb-6 text-foreground">
                      Attempts for: {selectedQuiz.title}
                    </h2>

                    {attempts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No attempts yet.
                      </p>
                    ) : (
                      <ScrollArea className="h-[calc(100vh-350px)]">
                        <div className="space-y-4">
                          {attempts.map((attempt, index) => (
                            <Card
                              key={index}
                              className="bg-card border border-border"
                            >
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                                  <div>
                                    <h4 className="font-bold text-foreground">
                                      {attempt.student_email}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      Submitted:{" "}
                                      {new Date(
                                        attempt.end_time,
                                      ).toLocaleString()}
                                    </p>
                                    {attempt.auto_submitted && (
                                      <p className="text-destructive font-bold flex items-center gap-1 mt-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        AUTO-SUBMITTED (Violation)
                                      </p>
                                    )}
                                  </div>
                                  <Badge
                                    className={`text-xl font-bold px-4 py-2 text-white ${getScoreClass(attempt.score)}`}
                                  >
                                    {attempt.score.toFixed(1)}%
                                  </Badge>
                                </div>

                                {attempt.violations.length > 0 && (
                                  <div className="bg-muted p-4 rounded-lg border border-border mt-4">
                                    <div className="flex justify-between items-center mb-3">
                                      <h4 className="font-bold text-destructive flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Violations Detected (
                                        {attempt.violations.length})
                                      </h4>
                                      {attempt.session_id && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            viewEvidence(attempt.session_id!);
                                          }}
                                        >
                                          <Image className="w-4 h-4" />
                                          View Evidence
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {attempt.violations.map((v, vIndex) => (
                                        <div
                                          key={vIndex}
                                          className="p-3 bg-card rounded-lg border-l-4 border-l-destructive"
                                        >
                                          <p className="font-semibold text-foreground">
                                            {v.type}: {v.reason}
                                          </p>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            Confidence:{" "}
                                            {(v.confidence * 100).toFixed(1)}% |{" "}
                                            {new Date(
                                              v.timestamp,
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Modal */}
      <Dialog open={evidenceModalOpen} onOpenChange={setEvidenceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Evidence Images
            </DialogTitle>
          </DialogHeader>

          {evidenceLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">
                Loading evidence...
              </span>
            </div>
          ) : currentEvidence.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No evidence images captured for this session.</p>
            </div>
          ) : selectedImage ? (
            // Full-size image view
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="flex flex-col items-center">
                <img
                  src={`data:image/jpeg;base64,${selectedImage.image_base64}`}
                  alt="Evidence"
                  className="max-h-[60vh] object-contain rounded-lg border border-border"
                />
                <div className="mt-4 p-4 bg-muted rounded-lg w-full">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      className={getEventTypeColor(selectedImage.event_type)}
                    >
                      {selectedImage.event_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedImage.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium text-foreground">
                    {selectedImage.reason}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confidence: {(selectedImage.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Thumbnail grid view
            <ScrollArea className="h-[60vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
                {currentEvidence.map((evidence, index) => (
                  <div
                    key={index}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-200"
                    onClick={() => setSelectedImage(evidence)}
                  >
                    <img
                      src={`data:image/jpeg;base64,${evidence.image_base64}`}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent">
                      <Badge
                        className={`${getEventTypeColor(evidence.event_type)} text-xs`}
                      >
                        {evidence.event_type}
                      </Badge>
                      <p className="text-white text-xs mt-1 truncate">
                        {evidence.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
