"""
core/chunker.py

Splits large documents into smaller overlapping chunks.
Uses LangChain's RecursiveCharacterTextSplitter which is smarter
than simple character splitting — it tries to split at paragraph
breaks first, then sentences, then words, then characters.
This preserves semantic meaning better than naive splitting.
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings


class DocumentChunker:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,         # Max characters per chunk (500)
            chunk_overlap=settings.chunk_overlap,   # Characters shared between chunks (50)
            separators=[
                "\n\n",   # Try splitting at double newlines (paragraphs) first
                "\n",     # Then single newlines
                ". ",     # Then sentence endings
                " ",      # Then words
                "",       # Last resort: individual characters
            ],
        )

    def split(self, text: str, metadata: dict) -> list[dict]:
        """
        Split text into chunks and attach metadata to each chunk.

        Args:
            text: The full document text
            metadata: Info about the source (doc_id, filename, etc.)
                      This gets stored alongside each chunk in ChromaDB
                      so we know where each chunk came from.

        Returns:
            List of dicts, each with "content" and "metadata" keys
        """
        chunks = self.splitter.create_documents(
            texts=[text],
            metadatas=[metadata]
        )

        return [
            {
                "content": chunk.page_content,
                "metadata": chunk.metadata
            }
            for chunk in chunks
        ]