"""
services/ingestion.py

The document ingestion pipeline.

Full flow:
1. Receive a file path and file type
2. Extract raw text from the file (PDF or TXT)
3. Split text into chunks using DocumentChunker
4. Generate embeddings for all chunks using Embedder
5. Store chunks + embeddings in ChromaDB (vector database)
6. Return the number of chunks created

This runs as a background task so the API can respond immediately
while the heavy processing happens behind the scenes.
"""

import chromadb
import pypdf
from pathlib import Path

from config import settings
from core.chunker import DocumentChunker
from core.embedder import Embedder

# Initialize ChromaDB client — this connects to the local database folder
chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)

# Get or create the collection (like a table in a regular database)
# All document chunks go into this one collection
collection = chroma_client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"}  # Use cosine similarity for comparisons
)

# Initialize our chunker and embedder
chunker = DocumentChunker()
embedder = Embedder()


def extract_text(file_path: str, file_type: str) -> str:
    """
    Extract raw text from a file.
    Supports PDF and plain text files.

    Args:
        file_path: Path to the file on disk
        file_type: MIME type like "application/pdf" or "text/plain"

    Returns:
        Raw text content of the file

    Raises:
        ValueError: If the file type is not supported or file is empty
    """
    if file_type == "application/pdf":
        reader = pypdf.PdfReader(file_path)
        pages_text = []

        for page_num, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                pages_text.append(text)

        if not pages_text:
            raise ValueError(
                "Could not extract text from this PDF. "
                "It may be a scanned image PDF which requires OCR."
            )

        return "\n\n".join(pages_text)

    elif file_type in ("text/plain", "text/markdown"):
        content = Path(file_path).read_text(encoding="utf-8")
        if not content.strip():
            raise ValueError("The uploaded text file appears to be empty.")
        return content

    else:
        raise ValueError(
            f"Unsupported file type: {file_type}. "
            "Please upload a PDF or plain text file."
        )


async def ingest_document(
    doc_id: str,
    file_path: str,
    file_type: str,
    original_name: str
) -> int:
    """
    Run the full ingestion pipeline for one document.

    Args:
        doc_id: Unique ID for this document (from the database)
        file_path: Where the file is saved on disk
        file_type: MIME type of the file
        original_name: Original filename the user uploaded

    Returns:
        Number of chunks created and stored
    """
    print(f"\n📄 Ingesting document: {original_name}")

    # Step 1: Extract text
    print("  Step 1/4: Extracting text...")
    text = extract_text(file_path, file_type)
    print(f"  Extracted {len(text)} characters")

    # Step 2: Split into chunks
    print("  Step 2/4: Splitting into chunks...")
    chunks = chunker.split(
        text=text,
        metadata={
            "doc_id": doc_id,
            "source": original_name,
        }
    )
    print(f"  Created {len(chunks)} chunks")

    if not chunks:
        raise ValueError("Document produced no chunks. It may be too short.")

    # Step 3: Generate embeddings
    print("  Step 3/4: Generating embeddings (calling OpenAI)...")
    texts_to_embed = [chunk["content"] for chunk in chunks]
    embeddings = await embedder.embed_many(texts_to_embed)

    # Step 4: Store in ChromaDB
    print("  Step 4/4: Storing in ChromaDB...")
    collection.add(
        ids=[f"{doc_id}_chunk_{i}" for i in range(len(chunks))],
        embeddings=embeddings,
        documents=[chunk["content"] for chunk in chunks],
        metadatas=[chunk["metadata"] for chunk in chunks],
    )

    print(f"  ✅ Done! {len(chunks)} chunks stored in vector database\n")
    return len(chunks)


def delete_document_embeddings(doc_id: str):
    """
    Remove all chunks belonging to a document from ChromaDB.
    Called when an admin deletes a document.

    Args:
        doc_id: The document ID whose chunks should be deleted
    """
    # Find all chunk IDs for this document
    results = collection.get(where={"doc_id": doc_id})

    if results["ids"]:
        collection.delete(ids=results["ids"])
        print(f"  Deleted {len(results['ids'])} chunks for document {doc_id}")
    else:
        print(f"  No chunks found for document {doc_id}")