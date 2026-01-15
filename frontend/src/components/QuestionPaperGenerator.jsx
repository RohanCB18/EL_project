import { useState } from 'react';
import { jsPDF } from 'jspdf';
import './QuestionPaperGenerator.css';

function QuestionPaperGenerator({ sessionId, onGenerate, isLoading }) {
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(10);
    const [difficulty, setDifficulty] = useState('medium');
    const [includeAnswers, setIncludeAnswers] = useState(false);
    const [generatedPaper, setGeneratedPaper] = useState(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setError('');

        try {
            const result = await onGenerate({
                topic,
                numQuestions,
                difficulty,
                includeAnswers,
            });
            setGeneratedPaper(result);
        } catch (err) {
            setError(err.message || 'Failed to generate question paper');
        }
    };

    const downloadPDF = () => {
        if (!generatedPaper) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = 20;

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(generatedPaper.title, pageWidth / 2, y, { align: 'center' });
        y += 15;

        // Duration and Marks
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Marks: ${generatedPaper.total_marks}`, margin, y);
        doc.text(`Duration: ${generatedPaper.duration || `${(generatedPaper.total_marks || 10) * 2} minutes`}`, pageWidth - margin, y, { align: 'right' });
        y += 10;

        // Instructions
        doc.setFontSize(10);
        doc.text('Instructions: ' + generatedPaper.instructions, margin, y, { maxWidth: pageWidth - 2 * margin });
        y += 15;

        // Divider line
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Sections
        generatedPaper.sections?.forEach((section, sectionIdx) => {
            // Check if we need a new page
            if (y > 260) {
                doc.addPage();
                y = 20;
            }

            // Section header
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(section.name, margin, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            section.questions?.forEach((q, qIdx) => {
                // Check if we need a new page
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }

                // Question
                const questionNum = q.number || qIdx + 1;
                const questionText = `${questionNum}. ${q.question}`;
                const splitQuestion = doc.splitTextToSize(questionText, pageWidth - 2 * margin);
                doc.text(splitQuestion, margin, y);
                y += splitQuestion.length * 5 + 3;

                // Options for MCQs
                if (q.options && q.options.length > 0) {
                    q.options.forEach((opt) => {
                        if (y > 270) {
                            doc.addPage();
                            y = 20;
                        }
                        doc.text(`    ${opt}`, margin, y);
                        y += 5;
                    });
                    y += 3;
                }

                // Answer (if included)
                if (includeAnswers && q.answer) {
                    doc.setFont('helvetica', 'italic');
                    doc.text(`Answer: ${q.answer}`, margin + 10, y);
                    doc.setFont('helvetica', 'normal');
                    y += 8;
                }

                y += 5;
            });

            y += 10;
        });

        // Save the PDF
        doc.save(`${generatedPaper.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    };

    return (
        <div className="question-paper-generator">
            {/* Configuration Form */}
            <div className="generator-form glass-card">
                <h3>Configure Question Paper</h3>

                <div className="form-group">
                    <label htmlFor="topic">Topic / Subject</label>
                    <input
                        id="topic"
                        type="text"
                        className="input-field"
                        placeholder="e.g., Photosynthesis, French Revolution, Calculus"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={!sessionId}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="numQuestions">Number of Questions</label>
                        <select
                            id="numQuestions"
                            className="input-field"
                            value={numQuestions}
                            onChange={(e) => setNumQuestions(Number(e.target.value))}
                            disabled={!sessionId}
                        >
                            <option value={5}>5 Questions</option>
                            <option value={10}>10 Questions</option>
                            <option value={15}>15 Questions</option>
                            <option value={20}>20 Questions</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="difficulty">Difficulty Level</label>
                        <select
                            id="difficulty"
                            className="input-field"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            disabled={!sessionId}
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </div>

                <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={includeAnswers}
                            onChange={(e) => setIncludeAnswers(e.target.checked)}
                            disabled={!sessionId}
                        />
                        <span className="checkmark"></span>
                        Include answer key
                    </label>
                </div>

                {error && <p className="error-message">{error}</p>}

                <button
                    className="btn btn-teacher btn-lg generate-btn"
                    onClick={handleGenerate}
                    disabled={!sessionId || isLoading || !topic.trim()}
                >
                    {isLoading ? (
                        <>
                            <div className="spinner" style={{ width: 20, height: 20 }}></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Generate Question Paper
                        </>
                    )}
                </button>
            </div>

            {/* Generated Paper Preview */}
            {generatedPaper && (
                <div className="paper-preview glass-card">
                    <div className="preview-header">
                        <h3>{generatedPaper.title}</h3>
                        <button className="btn btn-teacher" onClick={downloadPDF}>
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            Download PDF
                        </button>
                    </div>

                    <div className="preview-meta">
                        <span>Total Marks: {generatedPaper.total_marks}</span>
                        <span>Duration: {generatedPaper.duration || `${(generatedPaper.total_marks || 10) * 2} minutes`}</span>
                    </div>

                    <p className="preview-instructions">{generatedPaper.instructions}</p>

                    <div className="preview-sections">
                        {generatedPaper.sections?.map((section, idx) => (
                            <div key={idx} className="preview-section">
                                <h4>{section.name}</h4>
                                {section.marks_per_question && (
                                    <span className="marks-badge">{section.marks_per_question} mark(s) each</span>
                                )}

                                <div className="questions-list">
                                    {section.questions?.map((q, qIdx) => (
                                        <div key={qIdx} className="question-item">
                                            <p className="question-text">
                                                <strong>{q.number || qIdx + 1}.</strong> {q.question}
                                            </p>

                                            {q.options && (
                                                <ul className="options-list">
                                                    {q.options.map((opt, oIdx) => (
                                                        <li key={oIdx}>{opt}</li>
                                                    ))}
                                                </ul>
                                            )}

                                            {includeAnswers && q.answer && (
                                                <p className="answer-text">
                                                    <em>Answer: {q.answer}</em>
                                                </p>
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

export default QuestionPaperGenerator;
