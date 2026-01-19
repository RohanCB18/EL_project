import { useState } from 'react';
import Navbar from '../components/Navbar';
import PdfUploader from '../components/PdfUploader';
import QuestionPaperGenerator from '../components/QuestionPaperGenerator';
import api from '../services/api';
import './TeacherDashboard.css';

function TeacherDashboard() {
    const [sessionId, setSessionId] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async (file) => {
        setIsUploading(true);
        setError('');

        try {
            const result = await api.uploadPdf(file, 'teacher');
            setSessionId(result.session_id);
            setUploadedFile(result.filename);
        } catch (err) {
            setError(err.message || 'Failed to upload PDF');
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerate = async (options) => {
        setIsGenerating(true);
        try {
            const result = await api.generateQuestionPaper(sessionId, options);
            return result;
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="teacher-dashboard">
            <Navbar />

            <main className="dashboard-main">
                <div className="container">
                    <header className="dashboard-header teacher-header">
                        <div className="header-content">
                            <div className="header-badge teacher-badge">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                                    <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Teacher Mode
                            </div>
                            <h1>Question Paper Generator</h1>
                            <p>Upload your course material and create professional question papers in seconds</p>
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

                    <div className="teacher-grid">
                        {/* Upload Section */}
                        <section className="upload-section glass-card">
                            <div className="section-header">
                                <div className="section-icon teacher-icon">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Step 1: Upload Course Material</h3>
                                    <p>Upload a PDF containing the topic content for question paper generation</p>
                                </div>
                            </div>

                            <PdfUploader
                                onUpload={handleUpload}
                                isLoading={isUploading}
                                userType="teacher"
                            />

                            {uploadedFile && (
                                <div className="upload-success">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Material uploaded: <strong>{uploadedFile}</strong></span>
                                </div>
                            )}
                        </section>

                        {/* Generator Section */}
                        <section className="generator-section">
                            <div className="section-header-inline">
                                <div className="section-icon teacher-icon">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h3>Step 2: Configure & Generate</h3>
                                    <p>Set your preferences and generate a professional question paper</p>
                                </div>
                            </div>

                            <QuestionPaperGenerator
                                sessionId={sessionId}
                                onGenerate={handleGenerate}
                                isLoading={isGenerating}
                            />
                        </section>
                    </div>

                    {/* Features Info */}
                    <div className="teacher-features">
                        <div className="feature-item">
                            <div className="feature-icon-sm">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <h4>Multiple Question Types</h4>
                                <p>MCQs, short answer, and long answer questions</p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon-sm">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 20V10M18 20V4M6 20v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <h4>Adjustable Difficulty</h4>
                                <p>Easy, medium, or hard difficulty levels</p>
                            </div>
                        </div>

                        <div className="feature-item">
                            <div className="feature-icon-sm">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <h4>PDF Download</h4>
                                <p>Download and share with students</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default TeacherDashboard;
