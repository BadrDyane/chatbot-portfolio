"""
services/retrieval.py

Retrieves relevant document chunks for a user's question.

Flow:
1. Take the user's question as text
2. Convert it to an embedding vector using OpenAI
3. Search ChromaDB for the chunks with most similar vectors
4. Return the top matching chunks as context for the LLM

This is the "R" in RAG (Retrieval Augmented Generation).
"""

import chromadb
from config import settings
from core.embedder import Embedder

# Connect to the same ChromaDB collection used in ingestion
chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
collection = chroma_client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"}
)

embedder = Embedder()


async def retrieve_context(query: str) -> list[str]:
    """
    Find the most relevant document chunks for a given query.

    Args:
        query: The user's question in plain text

    Returns:
        List of relevant text chunks (the context we will send to the LLM)
        Returns empty list if no documents are in the knowledge base.
    """
    # Check if the collection has any documents
    if collection.count() == 0:
        print("  Warning: Knowledge base is empty. No documents have been uploaded.")
        return []

    # Embed the user's question
    query_embedding = await embedder.embed_one(query)

    # Search for the most similar chunks
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(settings.retrieval_top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    if not results["documents"] or not results["documents"][0]:
        return []

    # Log what we found (helpful for debugging)
    print(f"  Retrieved {len(results['documents'][0])} chunks")
    for i, (doc, meta, dist) in enumerate(zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    )):
        print(f"    Chunk {i+1}: from '{meta.get('source', 'unknown')}' (distance: {dist:.3f})")

    return results["documents"][0]