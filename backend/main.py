"""
main.py

The FastAPI application entry point.
This file:
  1. Creates the FastAPI app
  2. Adds middleware (CORS so the frontend can talk to the backend)
  3. Connects the API routers
  4. Handles startup tasks (creating DB tables, creating folders)
  5. Provides a /health endpoint to confirm everything is working
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pathlib import Path

from database import engine, Base
from config import settings
from api import admin, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on startup and shutdown.
    The code before "yield" runs when the server starts.
    The code after "yield" runs when the server stops.
    """

    print("🚀 Starting SupportAI backend...")

    # Create directories if they do not exist yet
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
    print(f"  ✓ Upload directory ready: {settings.upload_dir}")
    print(f"  ✓ ChromaDB directory ready: {settings.chroma_persist_dir}")

    # Create all database tables defined in models.py
    # This is safe to run multiple times — it only creates tables that do not exist yet
    Base.metadata.create_all(bind=engine)
    print("  ✓ Database tables created")

    print("✅ Backend ready at http://localhost:8000")
    print("📚 API docs at http://localhost:8000/docs")

    yield  # Server is now running and accepting requests

    print("👋 Shutting down SupportAI backend")


# Create the FastAPI application
app = FastAPI(
    title="SupportAI — AI Customer Support Chatbot",
    description=(
        "A RAG-powered chatbot API. "
        "Upload documents to the knowledge base, "
        "then ask questions and get AI-generated answers based on your content."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# CORS Middleware
# This allows your React frontend to make requests to this backend.
# Without this, the browser blocks all requests with a CORS error.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server (React)
        "http://localhost:3000",  # Alternative React port
    ],
    allow_credentials=True,
    allow_methods=["*"],   # Allow GET, POST, DELETE, etc.
    allow_headers=["*"],   # Allow all headers
)


# Connect the API routers
# All admin routes will be available at /admin/...
# All chat routes will be available at /chat/...
app.include_router(admin.router)
app.include_router(chat.router)


@app.get("/health", tags=["system"])
def health_check():
    """
    Health check endpoint.
    Returns 200 OK with server status.
    Used to verify the server is running correctly.
    Useful for deployment monitoring and CI/CD pipelines.
    """
    return {
        "status": "ok",
        "version": "1.0.0",
        "model": settings.openai_model,
        "embedding_model": settings.openai_embedding_model,
    }


# This block only runs when you execute: python main.py
# When using uvicorn directly, this block is ignored
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-restarts when you save a file
    )