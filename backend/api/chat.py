"""
api/chat.py

Chat API routes for user conversations.

Endpoints:
  POST /chat/message    Send a question, get a streaming AI answer
  GET  /chat/history    Get conversation history for a session
  DELETE /chat/history  Clear conversation history for a session
"""

import uuid
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Conversation
from services.retrieval import retrieve_context
from services.llm import generate_answer_stream

router = APIRouter(prefix="/chat", tags=["chat"])


# ── Request model ─────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    session_id: str | None = None  # If None, we generate a new one

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is your refund policy?",
                "session_id": "optional-existing-session-id"
            }
        }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/message")
async def chat_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Send a question to the chatbot and get a streaming AI answer.

    Flow:
    1. Generate or reuse session ID
    2. Load conversation history for this session
    3. Embed the question and search ChromaDB for relevant chunks
    4. Save the user message to the database
    5. Stream the AI answer token by token
    6. Save the complete answer to the database when done

    The response is Server-Sent Events (SSE) format.
    Each event contains either a token or a done signal.
    """

    # Step 1: Get or create session ID
    session_id = request.session_id or str(uuid.uuid4())

    # Validate question is not empty
    question = request.question.strip()
    if not question:
        async def error_stream():
            yield f"data: {json.dumps({'error': 'Question cannot be empty', 'session_id': session_id})}\n\n"
        return StreamingResponse(error_stream(), media_type="text/event-stream")

    # Step 2: Load conversation history for this session
    history_records = (
        db.query(Conversation)
        .filter(Conversation.session_id == session_id)
        .order_by(Conversation.created_at)
        .all()
    )
    history = [
        {"role": record.role, "content": record.content}
        for record in history_records
    ]

    print(f"\n💬 New message in session {session_id[:8]}...")
    print(f"   Question: {question}")
    print(f"   History: {len(history)} previous messages")

    # Step 3: Retrieve relevant context from ChromaDB
    print("   Searching knowledge base...")
    context_chunks = await retrieve_context(question)
    print(f"   Found {len(context_chunks)} relevant chunks")

    # Step 4: Save user message to database
    user_message = Conversation(
        session_id=session_id,
        role="user",
        content=question,
    )
    db.add(user_message)
    db.commit()

    # Step 5 + 6: Stream response and save when complete
    collected_tokens = []

    async def stream_response():
        """
        Generator that streams tokens and saves the complete
        response to the database when streaming is finished.
        """
        try:
            async for token in generate_answer_stream(question, context_chunks, history):
                collected_tokens.append(token)

                # Send each token as an SSE event
                yield f"data: {json.dumps({'token': token, 'session_id': session_id})}\n\n"

            # Stream finished — save the complete response
            complete_answer = "".join(collected_tokens)

            assistant_message = Conversation(
                session_id=session_id,
                role="assistant",
                content=complete_answer,
            )
            db.add(assistant_message)
            db.commit()

            print(f"   ✅ Response complete ({len(complete_answer)} chars)")

            # Send done signal
            yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

        except Exception as e:
            print(f"   ❌ Error generating response: {e}")
            error_msg = "Sorry, I encountered an error while generating a response. Please try again."

            yield f"data: {json.dumps({'token': error_msg, 'session_id': session_id})}\n\n"
            yield f"data: {json.dumps({'done': True, 'session_id': session_id})}\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Important for nginx deployments
        }
    )


@router.get("/history/{session_id}")
def get_history(session_id: str, db: Session = Depends(get_db)):
    """
    Get all messages in a conversation session.
    The frontend uses this to restore chat history on page reload.
    """
    messages = (
        db.query(Conversation)
        .filter(Conversation.session_id == session_id)
        .order_by(Conversation.created_at)
        .all()
    )

    return {
        "session_id": session_id,
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in messages
        ]
    }


@router.delete("/history/{session_id}")
def clear_history(session_id: str, db: Session = Depends(get_db)):
    """
    Clear all messages for a session.
    Lets users start a fresh conversation.
    """
    deleted = (
        db.query(Conversation)
        .filter(Conversation.session_id == session_id)
        .delete()
    )
    db.commit()

    return {"message": f"Cleared {deleted} messages for session {session_id}"}