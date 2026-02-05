"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Star, X, Check, Download, CheckSquare, BarChart3 } from "lucide-react";
import { jsPDF } from "jspdf";
import api, { QuestionPaper, GeneratePaperOptions } from "@/lib/api";

export default function TeacherDashboard() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        setError("");

        try {
            const result = await api.uploadPdf(file, "teacher");
            setSessionId(result.session_id);
            setUploadedFile(result.filename);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to upload PDF");
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerate = async (options: GeneratePaperOptions) => {
        if (!sessionId) return null;
        setIsGenerating(true);
        try {
            return await api.generateQuestionPaper(sessionId, options);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full text-sm mb-4">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    Teacher Mode
                </div>
                <h1 className="text-3xl font-bold mb-2">Question Paper Generator</h1>
                <p className="text-muted-foreground">Upload your course material and create professional question papers in seconds</p>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                    <span className="text-lg">⚠️</span>
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="space-y-6">
                {/* Step 1: Upload */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="icon-wrap">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Step 1: Upload Course Material</h3>
                            <p className="text-sm text-muted-foreground">Upload a PDF containing the topic content for question paper generation</p>
                        </div>
                    </div>

                    <PdfUploader onUpload={handleUpload} isLoading={isUploading} />

                    {uploadedFile && (
                        <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-success/10 text-success border border-success/20">
                            <Check className="w-5 h-5" />
                            <span>Material uploaded: <strong>{uploadedFile}</strong></span>
                        </div>
                    )}
                </div>

                {/* Step 2: Generate */}
                <div className="glass rounded-2xl p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="icon-wrap icon-wrap-accent">
                            <Star className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Step 2: Configure & Generate</h3>
                            <p className="text-sm text-muted-foreground">Set your preferences and generate a professional question paper</p>
                        </div>
                    </div>

                    <QuestionPaperGenerator
                        sessionId={sessionId}
                        onGenerate={handleGenerate}
                        isLoading={isGenerating}
                    />
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border/50">
                    <FeatureItem icon={<CheckSquare className="w-5 h-5" />} title="Multiple Question Types" description="MCQs, short answer, and long answer questions" />
                    <FeatureItem icon={<BarChart3 className="w-5 h-5" />} title="Adjustable Difficulty" description="Easy, medium, or hard difficulty levels" />
                    <FeatureItem icon={<Download className="w-5 h-5" />} title="PDF Download" description="Download and share with students" />
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="icon-wrap">{icon}</div>
            <div>
                <h4 className="font-medium text-sm">{title}</h4>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

function PdfUploader({ onUpload, isLoading }: { onUpload: (file: File) => void; isLoading: boolean }) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === "application/pdf") {
            setSelectedFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setSelectedFile(file);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            onUpload(selectedFile);
        }
    };

    const handleRemove = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div>
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

                {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Processing...</p>
                    </div>
                ) : selectedFile ? (
                    <div className="flex items-center justify-center gap-4">
                        <div className="icon-wrap icon-wrap-accent">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(); }} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-10 h-10 text-muted-foreground" />
                        <p><span className="text-accent font-medium">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF files only (max 10MB)</p>
                    </div>
                )}
            </div>

            {selectedFile && !isLoading && (
                <button onClick={handleUpload} className="btn btn-accent w-full mt-4">
                    <Upload className="w-4 h-4" />
                    Process PDF
                </button>
            )}
        </div>
    );
}

function QuestionPaperGenerator({
    sessionId,
    onGenerate,
    isLoading,
}: {
    sessionId: string | null;
    onGenerate: (options: GeneratePaperOptions) => Promise<QuestionPaper | null>;
    isLoading: boolean;
}) {
    const [topic, setTopic] = useState("");
    const [numQuestions, setNumQuestions] = useState(10);
    const [difficulty, setDifficulty] = useState("medium");
    const [testMode, setTestMode] = useState("mcq");
    const [includeAnswers, setIncludeAnswers] = useState(false);
    const [generatedPaper, setGeneratedPaper] = useState<QuestionPaper | null>(null);
    const [formError, setFormError] = useState("");

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setFormError("Please enter a topic");
            return;
        }
        setFormError("");

        try {
            const result = await onGenerate({ topic, numQuestions, difficulty, testMode, includeAnswers });
            setGeneratedPaper(result);
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : "Failed to generate");
        }
    };

    const downloadPDF = () => {
        if (!generatedPaper) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 25;
        const contentWidth = pageWidth - 2 * margin;
        const lineHeight = 6;
        let y = 25;

        // Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(generatedPaper.title, contentWidth);
        titleLines.forEach((line: string) => {
            doc.text(line, pageWidth / 2, y, { align: "center" });
            y += 8;
        });
        y += 5;

        // Marks & Duration
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Marks: ${generatedPaper.total_marks}`, margin, y);
        doc.text(`Duration: ${generatedPaper.duration || `${(generatedPaper.total_marks || 10) * 2} minutes`}`, pageWidth - margin, y, { align: "right" });
        y += 10;

        // Instructions
        doc.setFontSize(9);
        const instLines = doc.splitTextToSize("Instructions: " + generatedPaper.instructions, contentWidth);
        instLines.forEach((line: string) => {
            doc.text(line, margin, y);
            y += 5;
        });
        y += 5;

        doc.setDrawColor(180);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Sections
        generatedPaper.sections?.forEach((section) => {
            if (y > pageHeight - 50) { doc.addPage(); y = 25; }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(section.name, margin, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            section.questions?.forEach((q, qIdx) => {
                if (y > pageHeight - 40) { doc.addPage(); y = 25; }

                const qText = `${q.number || qIdx + 1}. ${q.question}`;
                const qLines = doc.splitTextToSize(qText, contentWidth);
                qLines.forEach((line: string) => {
                    if (y > pageHeight - 25) { doc.addPage(); y = 25; }
                    doc.text(line, margin, y);
                    y += lineHeight;
                });
                y += 2;

                if (q.options) {
                    q.options.forEach((opt) => {
                        const optLines = doc.splitTextToSize(`    ${opt}`, contentWidth - 10);
                        optLines.forEach((line: string) => {
                            if (y > pageHeight - 25) { doc.addPage(); y = 25; }
                            doc.text(line, margin, y);
                            y += 5;
                        });
                    });
                    y += 3;
                }

                if (includeAnswers && q.answer) {
                    doc.setFont("helvetica", "italic");
                    const aLines = doc.splitTextToSize(`Answer: ${q.answer}`, contentWidth - 15);
                    aLines.forEach((line: string) => {
                        if (y > pageHeight - 25) { doc.addPage(); y = 25; }
                        doc.text(line, margin + 10, y);
                        y += 5;
                    });
                    doc.setFont("helvetica", "normal");
                    y += 3;
                }
                y += 5;
            });
            y += 8;
        });

        doc.save(`${generatedPaper.title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="label-muted block mb-2">Topic / Subject</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g., Photosynthesis, French Revolution, Calculus"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={!sessionId}
                    />
                </div>
                <div>
                    <label className="label-muted block mb-2">Number of Questions</label>
                    <select className="input" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} disabled={!sessionId}>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                        <option value={20}>20 Questions</option>
                    </select>
                </div>
                <div>
                    <label className="label-muted block mb-2">Difficulty Level</label>
                    <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={!sessionId}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="label-muted block mb-2">Test Mode</label>
                    <select className="input" value={testMode} onChange={(e) => setTestMode(e.target.value)} disabled={!sessionId}>
                        <option value="mcq">MCQ Only (1 mark each)</option>
                        <option value="theory">Theory - Short (2 marks) + Long (5 marks)</option>
                        <option value="hybrid">Hybrid - MCQ + Short + Long</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeAnswers}
                            onChange={(e) => setIncludeAnswers(e.target.checked)}
                            disabled={!sessionId}
                            className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">Include answer key</span>
                    </label>
                </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <button
                onClick={handleGenerate}
                disabled={!sessionId || isLoading || !topic.trim()}
                className="btn btn-primary w-full text-lg py-4"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <Star className="w-5 h-5" />
                        Generate Question Paper
                    </>
                )}
            </button>

            {/* Preview */}
            {generatedPaper && (
                <div className="border border-border rounded-2xl p-6 bg-white mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{generatedPaper.title}</h3>
                        <button onClick={downloadPDF} className="btn btn-primary">
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                    </div>
                    <div className="flex gap-6 text-sm text-muted-foreground mb-4">
                        <span>Total Marks: {generatedPaper.total_marks}</span>
                        <span>Duration: {generatedPaper.duration || `${(generatedPaper.total_marks || 10) * 2} minutes`}</span>
                    </div>
                    <p className="text-sm italic p-3 bg-muted rounded-xl mb-6">{generatedPaper.instructions}</p>

                    <div className="space-y-6">
                        {generatedPaper.sections?.map((section, idx) => (
                            <div key={idx}>
                                <h4 className="font-semibold text-primary mb-3">{section.name}</h4>
                                <div className="space-y-3">
                                    {section.questions?.map((q, qIdx) => (
                                        <div key={qIdx} className="p-4 bg-muted rounded-xl border-l-3 border-primary">
                                            <p><strong>{q.number || qIdx + 1}.</strong> {q.question}</p>
                                            {q.options && (
                                                <ul className="mt-2 ml-4 space-y-1 text-sm text-muted-foreground">
                                                    {q.options.map((opt, oIdx) => <li key={oIdx}>{opt}</li>)}
                                                </ul>
                                            )}
                                            {includeAnswers && q.answer && (
                                                <p className="mt-2 pt-2 border-t border-dashed border-border text-sm italic text-primary">Answer: {q.answer}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
