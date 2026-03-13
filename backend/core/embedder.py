"""
core/embedder.py
Uses requests directly instead of the OpenAI SDK (httpx incompatibility fix)
"""

import requests
from config import settings


class Embedder:
    def __init__(self):
        self.model = settings.openai_embedding_model
        self.batch_size = 100
        self.headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json"
        }

    def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        response = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers=self.headers,
            json={"model": self.model, "input": texts},
            timeout=30
        )
        response.raise_for_status()
        return [item["embedding"] for item in response.json()["data"]]

    async def embed_many(self, texts: list[str]) -> list[list[float]]:
        all_embeddings = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            embeddings = self._embed_batch(batch)
            all_embeddings.extend(embeddings)
            print(f"  Embedded batch {i // self.batch_size + 1} ({len(batch)} chunks)")
        return all_embeddings

    async def embed_one(self, text: str) -> list[float]:
        return self._embed_batch([text])[0]