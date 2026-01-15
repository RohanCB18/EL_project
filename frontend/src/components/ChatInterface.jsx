import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatInterface.css';

function ChatInterface({ sessionId, onAsk, onSummary, onQuiz, isLoading }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');

        try {
            const result = await onAsk(input);
            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: result.answer,
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'error',
                content: error.message || 'Failed to get response',
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
    };

    const handleQuickAction = async (action) => {
        if (isLoading) return;

        let actionMessage, result;

        try {
            if (action === 'summary') {
                actionMessage = {
                    id: Date.now(),
                    type: 'user',
                    content: '📝 Generate a summary of this document',
                };
                setMessages((prev) => [...prev, actionMessage]);

                result = await onSummary();
                const aiMessage = {
                    id: Date.now() + 1,
                    type: 'ai',
                    content: result.summary,
                };
                setMessages((prev) => [...prev, aiMessage]);
            } else if (action === 'quiz') {
                actionMessage = {
                    id: Date.now(),
                    type: 'user',
                    content: '📋 Generate a practice quiz',
                };
                setMessages((prev) => [...prev, actionMessage]);

                result = await onQuiz();
                const quizMessage = {
                    id: Date.now() + 1,
                    type: 'quiz',
                    content: result.quiz,
                };
                setMessages((prev) => [...prev, quizMessage]);
            }
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'error',
                content: error.message || 'Failed to perform action',
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-interface">
            {/* Chat Header */}
            <div className="chat-header">
                <p className="chat-tagline">
                    ✨ Ask questions, get summaries, generate quizzes, clear doubts & more!
                </p>
            </div>

            {/* Messages Area */}
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3>Start a Conversation</h3>
                        <p>Ask questions about your PDF or use the quick actions above</p>
                    </div>
                ) : (
                    <div className="messages">
                        {messages.map((message) => (
                            <div key={message.id} className={`message message-${message.type}`}>
                                {message.type === 'user' && (
                                    <div className="message-avatar user-avatar">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" />
                                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    </div>
                                )}
                                {message.type === 'ai' && (
                                    <div className="message-avatar ai-avatar">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                                <div className="message-content">
                                    {message.type === 'quiz' ? (
                                        <div className="quiz-content">
                                            <h4>📋 Practice Quiz</h4>
                                            {message.content.map((q, idx) => (
                                                <div key={idx} className="quiz-question">
                                                    <p className="question-text">
                                                        <strong>Q{idx + 1}:</strong> {q.question}
                                                    </p>
                                                    {q.options && (
                                                        <ul className="options-list">
                                                            {q.options.map((opt, i) => (
                                                                <li key={i}>{opt}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                    <details className="answer-reveal">
                                                        <summary>Show Answer</summary>
                                                        <p><strong>Answer:</strong> {q.correct_answer}</p>
                                                        {q.explanation && <p><em>{q.explanation}</em></p>}
                                                    </details>
                                                </div>
                                            ))}
                                        </div>
                                    ) : message.type === 'ai' ? (
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    ) : (
                                        <p>{message.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message message-ai">
                                <div className="message-avatar ai-avatar">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="chat-input-container">
                <input
                    type="text"
                    className="chat-input input-field"
                    placeholder={sessionId ? "Ask a question about your PDF..." : "Upload a PDF first to start chatting"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!sessionId || isLoading}
                />
                <button
                    className="send-btn btn btn-student"
                    onClick={handleSend}
                    disabled={!input.trim() || !sessionId || isLoading}
                >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default ChatInterface;
