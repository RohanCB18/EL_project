"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Send, Lightbulb, X, Check, MessageSquare, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";

export default function StudentDashboard() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        setError("");

        try {
            const result = await api.uploadPdf(file, "student");
            setSessionId(result.session_id);
            setUploadedFile(result.filename);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to upload PDF");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full text-sm mb-4">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Student Mode
                </div>
                <h1 className="text-3xl font-bold mb-2">Study Companion</h1>
                <p className="text-muted-foreground">Upload your study material and start learning with AI assistance</p>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                    <span className="text-lg">⚠️</span>
                    {error}
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Upload Section */}
                    <div className="glass rounded-2xl p-5">
                        <h3 className="label-muted mb-3 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Upload PDF
                        </h3>
                        <PdfUploader onUpload={handleUpload} isLoading={isUploading} />
                    </div>

                    {/* Status */}
                    {uploadedFile && (
                        <div className="glass rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-success">Ready to Chat</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{uploadedFile}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="glass rounded-2xl p-5">
                        <h3 className="label-muted mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Tips
                        </h3>
                        <ul className="space-y-2 text-sm text-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">→</span>
                                Ask specific questions for better answers
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">→</span>
                                Request &quot;summarize this document&quot; for overview
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">→</span>
                                Ask to &quot;create a quiz&quot; to test yourself
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="glass rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
                    <ChatInterface sessionId={sessionId} />
                </div>
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
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

                {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Processing...</p>
                    </div>
                ) : selectedFile ? (
                    <div className="flex items-center gap-3 text-left">
                        <div className="icon-wrap">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(); }} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <p className="text-sm"><span className="text-primary font-medium">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PDF files only (max 10MB)</p>
                    </div>
                )}
            </div>

            {selectedFile && !isLoading && (
                <button onClick={handleUpload} className="btn btn-primary w-full mt-3">
                    <Upload className="w-4 h-4" />
                    Process PDF
                </button>
            )}
        </div>
    );
}

interface Message {
    id: number;
    type: "user" | "ai" | "error";
    content: string;
}

function ChatInterface({ sessionId }: { sessionId: string | null }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || !sessionId) return;

        const userMessage: Message = { id: Date.now(), type: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const result = await api.askQuestion(sessionId, input);
            setMessages((prev) => [...prev, { id: Date.now() + 1, type: "ai", content: result.answer }]);
        } catch (err: unknown) {
            setMessages((prev) => [...prev, { id: Date.now() + 1, type: "error", content: err instanceof Error ? err.message : "Failed to get response" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Header */}
            <div className="p-4 border-b border-border/50 text-center">
                <p className="text-sm text-muted-foreground">✨ Ask anything - questions, summaries, quizzes & more!</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">Start a Conversation</h3>
                        <p className="text-sm">Ask questions about your PDF</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.type === "user" ? "flex-row-reverse" : ""}`}>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === "user" ? "bg-primary text-white" : msg.type === "error" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"
                                }`}>
                                {msg.type === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.type === "user" ? "bg-primary text-white rounded-br-md" : msg.type === "error" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted rounded-bl-md"
                                }`}>
                                {msg.type === "ai" ? (
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p>{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-accent" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-md p-4">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50 flex gap-3">
                <input
                    type="text"
                    className="input flex-1"
                    placeholder={sessionId ? "Ask anything about your PDF..." : "Upload a PDF first to start chatting"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={!sessionId || isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || !sessionId || isLoading}
                    className="btn btn-primary px-4"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </>
    );
}
