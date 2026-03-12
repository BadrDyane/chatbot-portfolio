"""
models.py

Defines the database tables using SQLAlchemy models.
Each class here maps to one table in the database.

Tables:
- Document: tracks uploaded files and their processing status
- Conversation: stores chat message history per session
"""

from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from database import Base
from datetime import datetime
import uuid


class Document(Base):
    """
    Stores metadata about every uploaded document.

    When a user uploads a PDF, we:
    1. Save the file to disk
    2. Create a Document record with status="processing"
    3. Process the file in the background (chunk, embed, store)
    4. Update status to "ready" when done (or "error" if it failed)
    """

    __tablename__ = "documents"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())  # Random unique ID like "f47ac10b-58cc..."
    )
    filename = Column(String, nullable=False)          # Path on disk: ./data/uploads/abc123_manual.pdf
    original_name = Column(String, nullable=False)     # What the user named it: "Product Manual.pdf"
    file_type = Column(String, nullable=False)         # MIME type: "application/pdf"
    chunk_count = Column(Integer, default=0)           # How many chunks were created
    status = Column(String, default="processing")      # "processing" | "ready" | "error"
    created_at = Column(DateTime, default=datetime.utcnow)
    error_message = Column(Text, nullable=True)        # Filled in if status="error"

    def to_dict(self):
        """Convert to dictionary for JSON responses."""
        return {
            "id": self.id,
            "original_name": self.original_name,
            "file_type": self.file_type,
            "chunk_count": self.chunk_count,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "error_message": self.error_message,
        }


class Conversation(Base):
    """
    Stores every message in every chat session.

    A "session" is one conversation with one user.
    The frontend generates a random session_id and sends it with every message.
    This lets us load the history for that specific conversation.

    Each row is one message: either from the user ("user") or from the AI ("assistant").
    """

    __tablename__ = "conversations"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    session_id = Column(String, nullable=False, index=True)  # Groups messages by conversation
    role = Column(String, nullable=False)                     # "user" or "assistant"
    content = Column(Text, nullable=False)                    # The actual message text
    created_at = Column(DateTime, default=datetime.utcnow)