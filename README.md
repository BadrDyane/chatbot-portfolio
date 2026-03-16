# SupportAI — AI-Powered Customer Support Chatbot

> A production-ready RAG (Retrieval Augmented Generation) chatbot that lets businesses upload their documentation and instantly deploy an AI assistant that answers customer questions accurately — grounded entirely in their own content.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-orange?style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai)

---

## What It Does

Businesses upload PDF or text documents — product manuals, FAQs, policy documents, knowledge bases — and SupportAI transforms them into a fully functional AI support agent.

Users ask questions in natural language. The system retrieves the most relevant sections from the uploaded documents and generates accurate, grounded answers using GPT-4o-mini. The bot never makes up information — if the answer isn't in the documents, it says so.

---

## Live Demo

> Coming soon — deployment in progress.

---

## Features

- **Document Ingestion** — Upload PDF, TXT, and Markdown files through a drag-and-drop admin interface
- **RAG Architecture** — Retrieval Augmented Generation ensures answers are always grounded in real content
- **Streaming Responses** — Answers stream token by token in real time, exactly like ChatGPT
- **Conversation History** — Full multi-turn conversation memory per session stored in SQLite
- **Admin Dashboard** — Upload, monitor, and delete documents with live processing status
- **Vector Search** — ChromaDB powers semantic similarity search across all uploaded content
- **Background Processing** — Document ingestion runs asynchronously so the UI never hangs
- **Graceful Fallback** — When the answer isn't in the knowledge base, the bot says so clearly

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend (Vite)                   │
│         Chat Interface  │  Admin Dashboard               │
└──────────────┬──────────────────────┬────────────────────┘
               │ REST / SSE           │ REST
┌──────────────▼──────────────────────▼────────────────────┐
│                    FastAPI Backend                        │
│                                                           │
│   ┌─────────────────┐      ┌──────────────────────────┐  │
│   │ Ingestion        │      │   RAG Query Pipeline     │  │
│   │ PDF → Chunks     │      │   1. Embed question      │  │
│   │ Chunks → Vectors │      │   2. Search ChromaDB     │  │
│   │ Vectors → Store  │      │   3. Retrieve top chunks │  │
│   └─────────────────┘      │   4. Build prompt        │  │
│                             │   5. Stream LLM answer   │  │
│                             └──────────────────────────┘  │
└──────────────┬───────────────────────┬────────────────────┘
               │                       │
    ┌──────────▼──────┐    ┌──────────▼──────────┐
    │   ChromaDB      │    │  SQLite Database     │
    │ (Vector Store)  │    │ (Docs + Convos)      │
    └─────────────────┘    └──────────────────────┘
                                       │
                            ┌──────────▼──────────┐
                            │     OpenAI API       │
                            │  Embeddings + Chat   │
                            └─────────────────────┘
```

### RAG Pipeline — How It Works

1. **Ingestion** — Uploaded documents are parsed, split into 500-character overlapping chunks, and embedded using OpenAI's `text-embedding-3-small` model. Vectors are stored in ChromaDB.
2. **Retrieval** — When a user asks a question, the question is embedded and compared against all stored vectors using cosine similarity. The top 5 most relevant chunks are retrieved.
3. **Generation** — The retrieved chunks are injected into a system prompt alongside the conversation history. GPT-4o-mini generates a grounded answer and streams it back token by token.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | FastAPI |
| AI — Language Model | OpenAI GPT-4o-mini |
| AI — Embeddings | OpenAI text-embedding-3-small |
| Vector Database | ChromaDB |
| Relational Database | SQLite + SQLAlchemy |
| Document Processing | LangChain Text Splitters, PyPDF |
| Frontend Framework | React 18 + Vite |
| HTTP Client | Axios + Fetch (SSE streaming) |
| Runtime | Python 3.10+, Node 18+ |

---

## Project Structure

```
chatbot-portfolio/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Settings via pydantic-settings
│   ├── database.py              # SQLAlchemy setup
│   ├── models.py                # Document + Conversation models
│   ├── api/
│   │   ├── admin.py             # Upload, list, delete documents
│   │   └── chat.py              # Chat message + history endpoints
│   ├── services/
│   │   ├── ingestion.py         # Full ingestion pipeline
│   │   ├── retrieval.py         # Embedding + vector search
│   │   └── llm.py               # Prompt building + streaming
│   ├── core/
│   │   ├── chunker.py           # RecursiveCharacterTextSplitter
│   │   └── embedder.py          # OpenAI embeddings via requests
│   └── data/
│       ├── uploads/             # Raw uploaded files
│       └── chroma_db/           # ChromaDB persistent storage
└── frontend/
    └── src/
        ├── App.jsx              # Root component + layout
        ├── api/client.js        # All backend communication
        ├── hooks/
        │   ├── useChat.js       # Chat state + streaming logic
        │   └── useDocuments.js  # Document management + polling
        └── components/
            ├── Chat/            # ChatWindow, MessageBubble, TypingIndicator
            └── Admin/           # AdminPanel, DocumentList, UploadZone
```

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- An OpenAI API key with billing enabled — [platform.openai.com](https://platform.openai.com)

### 1. Clone the Repository

```bash
git clone https://github.com/BadrDyane/chatbot-portfolio.git
cd chatbot-portfolio
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# On Mac/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create your `.env` file inside the `backend/` folder:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
CHROMA_PERSIST_DIR=./data/chroma_db
UPLOAD_DIR=./data/uploads
CHUNK_SIZE=500
CHUNK_OVERLAP=50
RETRIEVAL_TOP_K=5
MAX_FILE_SIZE_MB=20
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

API documentation is auto-generated at `http://localhost:8000/docs`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Navigate to `http://localhost:5173`

---

## Usage

### Adding Documents

1. Click the **Admin** tab in the top navigation
2. Drag and drop a PDF or TXT file into the upload zone, or click to browse
3. Wait for the status badge to change from **Processing** to **Ready**
4. The document is now part of the knowledge base

### Asking Questions

1. Click the **Chat** tab
2. Type a question in the input box or click one of the suggestion chips
3. The AI will retrieve relevant content from your documents and stream an answer
4. Continue the conversation — the bot remembers the full session history

### What Works Best

Ask specific, content-rich questions that align with sections of your documents:

```
✅ "What is your refund policy?"
✅ "What are the main risks mentioned in the report?"
✅ "How does the product handle data privacy?"
✅ "What support options are available?"

❌ "What is the company name?"  ← too vague for retrieval
❌ "Summarize everything"        ← too broad
```

---

## API Reference

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/documents/upload` | Upload a document |
| `GET` | `/admin/documents` | List all documents |
| `GET` | `/admin/documents/{id}/status` | Get processing status |
| `DELETE` | `/admin/documents/{id}` | Delete a document |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/message` | Send a message, receive SSE stream |
| `GET` | `/chat/history/{session_id}` | Get conversation history |
| `DELETE` | `/chat/history/{session_id}` | Clear conversation history |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

---

## Key Engineering Decisions

**Why ChromaDB?** Persistent by default, simple API, handles metadata filtering, and ideal for projects at this scale. FAISS is faster at massive scale but requires more manual index management.

**Why stream responses?** SSE streaming delivers tokens as they arrive from OpenAI, making the UI feel instantaneous even on longer responses. This is the same pattern used by ChatGPT.

**Why `requests` instead of the OpenAI SDK?** The OpenAI Python SDK uses `httpx` internally which has known SSL/proxy conflicts on certain Windows Server environments. Calling the REST API directly with `requests` is more reliable across all environments with no loss of functionality.

**Why background tasks for ingestion?** Large PDFs can take 10-30 seconds to process. Running ingestion synchronously would time out the HTTP request. FastAPI background tasks return `202 Accepted` immediately and update the database record when processing completes.

**Why `temperature=0.3` on the LLM?** Lower temperature produces more factual, consistent answers. A support bot should be precise, not creative.

---

## Potential Improvements

- [ ] Support for website scraping as a knowledge source
- [ ] Multi-tenant support with separate knowledge bases per client
- [ ] Authentication layer for the admin panel
- [ ] Re-ranking retrieved chunks for better accuracy
- [ ] Support for DOCX and CSV file formats
- [ ] Usage analytics dashboard
- [ ] Deployment via Docker Compose

---

## Use Cases

This system is suitable for any business that wants to automate answers to common customer questions:

- E-commerce stores — product info, shipping, returns
- SaaS companies — feature docs, onboarding, troubleshooting
- Healthcare providers — policies, appointment info, FAQs
- Law firms — general service info, process explanations
- Educational institutions — enrollment, policies, schedules
- Any business with existing documentation

---

## Author

**Badr Dyane**
Full-Stack Developer — AI Integration Specialist

- GitHub: [github.com/BadrDyane](https://github.com/BadrDyane)
- Email: [badrdyane@gmail.com](mailto:badrdyane@gmail.com)

Interested in a custom AI chatbot for your business? Get in touch.

---

## License

This project is open source and available under the [MIT License](LICENSE).
