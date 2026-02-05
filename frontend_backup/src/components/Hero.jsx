import { Link } from 'react-router-dom';
import './Hero.css';

function Hero() {
    return (
        <section className="hero">
            {/* Animated background elements */}
            <div className="hero-bg">
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-orb hero-orb-3"></div>
                <div className="hero-grid"></div>
            </div>

            <div className="container hero-content">
                <div className="hero-badge animate-slide-up">
                    <span className="badge-icon">✨</span>
                    <span>AI-Powered Learning Companion</span>
                </div>

                <h1 className="hero-title animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    Transform Your PDFs Into
                    <span className="text-gradient"> Interactive Knowledge</span>
                </h1>

                <p className="hero-description animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    Upload any PDF and unlock its potential with AI. Ask questions, generate summaries,
                    create practice quizzes, and produce professional question papers — all powered by
                    advanced language models.
                </p>

                <div className="hero-buttons animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <Link to="/student" className="btn btn-student btn-lg">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 14v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        I'm a Student
                    </Link>

                    <Link to="/teacher" className="btn btn-teacher btn-lg">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        I'm a Teacher
                    </Link>
                </div>

                {/* Feature cards */}
                <div className="hero-features animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div className="feature-card">
                        <div className="feature-icon feature-icon-blue">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Smart Q&A</h3>
                        <p>Ask questions about your PDFs and get accurate, context-aware answers instantly</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon feature-icon-purple">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Auto Summaries</h3>
                        <p>Generate concise summaries that capture the key points of any document</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon feature-icon-green">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h3>Practice Quizzes</h3>
                        <p>Create interactive quizzes to test your understanding and reinforce learning</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon feature-icon-orange">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3>Question Papers</h3>
                        <p>Teachers can generate professional exam papers with downloadable PDFs</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Hero;
