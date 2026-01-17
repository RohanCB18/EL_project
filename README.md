# StudyGenius - AI PDF Study Companion

An AI-powered study companion that transforms PDFs into interactive learning experiences. Built with **FastAPI** backend and **React** frontend, powered by **LangChain** and **OpenRouter**.

## Features

### For Students
- **Upload PDFs** - Drag and drop your study materials
- **Smart Q&A** - Ask questions and get accurate, context-aware answers
- **Auto Summaries** - Generate concise summaries of any document
- **Practice Quizzes** - Create interactive quizzes to test your understanding
- **Clear Doubts** - Get explanations of complex topics

### For Teachers
- **Upload Course Material** - Upload PDFs containing topic content
- **Configure Question Papers** - Set topic, difficulty, and number of questions
- **Multiple Question Types** - MCQs, short answer, and long answer questions
- **Download as PDF** - Generate and download professional question papers

## Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **LangChain** - LLM application framework
- **OpenRouter** - Cloud LLM API (supports various models including LLaMA, Gemma, etc.)
- **FAISS** - Vector similarity search
- **Sentence Transformers** - Text embeddings
- **PyPDF2** - PDF text extraction

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **jsPDF** - PDF generation
- **Axios** - HTTP client

## Project Structure

```
EL_project/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── config.py          # Configuration settings
│   │   ├── services/
│   │   │   ├── pdf_service.py     # PDF processing
│   │   │   ├── vector_store.py    # FAISS vector store
│   │   │   └── llm_service.py     # LangChain + OpenRouter
│   │   ├── routers/
│   │   │   ├── student.py     # Student API endpoints
│   │   │   └── teacher.py     # Teacher API endpoints
│   │   └── models/
│   │       └── schemas.py     # Pydantic models
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service
│   │   └── index.css          # Global styles
│   ├── index.html
│   └── package.json
│
└── Chat-With-PDF-Using-LangChain-Gemini/  # Original Streamlit app (reference)
```

## Getting Started

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **OpenRouter API Key** - Get your free API key from [OpenRouter](https://openrouter.ai/)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or
   source venv/bin/activate  # Linux/Mac
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment file and configure your API key:
   ```bash
   copy .env.example .env  # Windows
   # or
   cp .env.example .env  # Linux/Mac
   ```

5. Edit the `.env` file and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_actual_api_key_here
   ```

6. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/student/upload` | Upload PDF for student |
| POST | `/student/ask` | Ask any question (queries, summaries, quizzes, etc.) |
| POST | `/teacher/upload` | Upload topic material |
| POST | `/teacher/generate-paper` | Generate question paper |


## Design

The application features a modern dark theme with:
- Glassmorphism effects
- Animated backgrounds
- Smooth micro-animations
- Responsive layout
- Color-coded themes for Student (blue) and Teacher (green)

## Usage

### Student Flow
1. Click "For Students" on the home page
2. Upload a PDF document
3. Once processed, ask questions in the chat interface
4. Use quick actions for summaries or quizzes

### Teacher Flow
1. Click "For Teachers" on the home page
2. Upload course material PDF
3. Configure question paper settings (topic, difficulty, number of questions)
4. Click "Generate Question Paper"
5. Preview and download as PDF

## Configuration

Edit `.env` in the backend directory:

```env
# Server settings
HOST=0.0.0.0
PORT=8000
DEBUG=True

# OpenRouter settings (REQUIRED)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Vector store path
VECTOR_STORE_PATH=./vector_stores
```

### Available Free Models on OpenRouter
You can change `OPENROUTER_MODEL` to use different models:
- `meta-llama/llama-3.1-8b-instruct:free` (default)
- `google/gemma-3-27b-it:free`
- `mistralai/mistral-7b-instruct:free`

Check [OpenRouter Models](https://openrouter.ai/models) for more options.

## License

This project is for educational purposes.

## Contributing

Feel free to open issues or submit pull requests!
