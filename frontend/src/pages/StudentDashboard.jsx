import { useState } from 'react';
import Navbar from '../components/Navbar';
import PdfUploader from '../components/PdfUploader';
import ChatInterface from '../components/ChatInterface';
import api from '../services/api';
import './StudentDashboard.css';

function StudentDashboard() {
    const [sessionId, setSessionId] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async (file) => {
        setIsUploading(true);
        setError('');

        try {
            const result = await api.uploadPdf(file, 'student');
            setSessionId(result.session_id);
            setUploadedFile(result.filename);
        } catch (err) {
            setError(err.message || 'Failed to upload PDF');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAsk = async (question) => {
        setIsChatLoading(true);
        try {
            const result = await api.askQuestion(sessionId, question);
            return result;
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleSummary = async () => {
        setIsChatLoading(true);
        try {
            const result = await api.getSummary(sessionId);
            return result;
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleQuiz = async () => {
        setIsChatLoading(true);
        try {
            const result = await api.generateQuiz(sessionId, 5, 'medium');
            return result;
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div className="student-dashboard">
            <Navbar />

            <main className="dashboard-main">
                <div className="container">
                    <header className="dashboard-header">
                        <div className="header-content">
                            <div className="header-badge">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 14l9-5-9-5-9 5 9 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M12 14v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Student Mode
                            </div>
                            <h1>Study Companion</h1>
                            <p>Upload your study material and start learning with AI assistance</p>
                        </div>
                    </header>

                    {error && (
                        <div className="error-banner">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="dashboard-grid">
                        {/* Sidebar with Upload */}
                        <aside className="dashboard-sidebar">
                            <div className="sidebar-section">
                                <h3>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    Upload PDF
                                </h3>
                                <PdfUploader
                                    onUpload={handleUpload}
                                    isLoading={isUploading}
                                    userType="student"
                                />
                            </div>

                            {uploadedFile && (
                                <div className="sidebar-section status-section">
                                    <div className="status-card success">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div>
                                            <span className="status-title">Ready to Chat</span>
                                            <span className="status-file">{uploadedFile}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="sidebar-section tips-section">
                                <h3>💡 Tips</h3>
                                <ul>
                                    <li>Ask specific questions for better answers</li>
                                    <li>Use "Summary" for quick overview</li>
                                    <li>Generate quizzes to test yourself</li>
                                    <li>Clear doubts on complex topics</li>
                                </ul>
                            </div>
                        </aside>

                        {/* Main Chat Area */}
                        <section className="dashboard-content">
                            <ChatInterface
                                sessionId={sessionId}
                                onAsk={handleAsk}
                                onSummary={handleSummary}
                                onQuiz={handleQuiz}
                                isLoading={isChatLoading}
                            />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default StudentDashboard;
