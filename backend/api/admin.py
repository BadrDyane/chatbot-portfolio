"""
api/admin.py

Admin API routes for document management.

Endpoints:
  POST   /admin/documents/upload   Upload a new document
  GET    /admin/documents          List all documents
  DELETE /admin/documents/{id}     Delete a document
"""

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import Document
from services.ingestion import ingest_document, delete_document_embeddings

router = APIRouter(prefix="/admin", tags=["admin"])

# File types we accept
ALLOWED_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
}


async def _process_document_background(
    doc_id: str,
    file_path: str,
    file_type: str,
    original_name: str,
    db: Session
):
    """
    Background task: run ingestion and update the database record.

    This runs AFTER the API has already responded to the client.
    The client sees status="processing" immediately,
    then status changes to "ready" or "error" when this finishes.
    """
    try:
        chunk_count = await ingest_document(doc_id, file_path, file_type, original_name)

        # Update document status to ready
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "ready"
            doc.chunk_count = chunk_count
            db.commit()

    except Exception as e:
        # Update document status to error
        print(f"  ❌ Ingestion failed for {original_name}: {str(e)}")
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "error"
            doc.error_message = str(e)
            db.commit()


@router.post("/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a document to the knowledge base.

    The file is saved immediately and processing starts in the background.
    Returns status="processing" right away so the UI does not hang.
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' is not supported. Please upload a PDF or TXT file."
        )

    # Validate file size
    # Read file content first to check size
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)

    if file_size_mb > settings.max_file_size_mb:
        raise HTTPException(
            status_code=400,
            detail=f"File is {file_size_mb:.1f}MB. Maximum allowed size is {settings.max_file_size_mb}MB."
        )

    # Generate unique document ID
    doc_id = str(uuid.uuid4())

    # Save file to disk
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Use doc_id as prefix to avoid filename conflicts
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = upload_dir / safe_filename

    with open(file_path, "wb") as f:
        f.write(file_content)

    # Create database record
    doc = Document(
        id=doc_id,
        filename=str(file_path),
        original_name=file.filename,
        file_type=file.content_type,
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Start background processing
    # This does NOT block — the API returns immediately
    background_tasks.add_task(
        _process_document_background,
        doc_id,
        str(file_path),
        file.content_type,
        file.filename,
        db,
    )

    return {
        "id": doc_id,
        "original_name": file.filename,
        "status": "processing",
        "message": "Document received. Processing has started in the background."
    }


@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    """
    List all uploaded documents with their status.
    The frontend uses this to display the document list in the admin panel.
    """
    documents = (
        db.query(Document)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [doc.to_dict() for doc in documents]


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    """
    Delete a document from the knowledge base.

    This:
    1. Removes the document's chunks from ChromaDB
    2. Deletes the file from disk
    3. Removes the database record
    """
    # Find the document
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove from ChromaDB
    try:
        delete_document_embeddings(doc_id)
    except Exception as e:
        print(f"  Warning: Could not delete embeddings: {e}")

    # Remove file from disk
    file_path = Path(doc.filename)
    if file_path.exists():
        file_path.unlink()

    # Remove from database
    db.delete(doc)
    db.commit()

    return {"message": f"Document '{doc.original_name}' has been deleted."}


@router.get("/documents/{doc_id}/status")
def get_document_status(doc_id: str, db: Session = Depends(get_db)):
    """
    Get the current processing status of a document.
    The frontend polls this while status is "processing".
    """
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    return {
        "id": doc.id,
        "status": doc.status,
        "chunk_count": doc.chunk_count,
        "error_message": doc.error_message,
    }