"""
services/llm.py
Uses requests directly instead of the OpenAI SDK (httpx incompatibility fix)
"""

import requests
import json
from typing import AsyncIterator
from config import settings

HEADERS = {
    "Authorization": f"Bearer {settings.openai_api_key}",
    "Content-Type": "application/json"
}

SYSTEM_PROMPT_TEMPLATE = """You are a helpful and professional customer support assistant.

Your job is to answer customer questions using ONLY the information provided in the context below.

Rules you must follow:
1. Only use information from the context to answer questions.
2. If the answer is not in the context, say: "I don't have information about that in my knowledge base. Please contact our support team directly."
3. Be concise and clear.
4. Be friendly and professional.
5. Never make up information or guess.

Context from knowledge base:
---
{context}
---"""


async def generate_answer_stream(
    question: str,
    context_chunks: list[str],
    history: list[dict],
) -> AsyncIterator[str]:
    context = "\n\n---\n\n".join(context_chunks) if context_chunks else "No relevant information found."

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_TEMPLATE.format(context=context)},
        *history[-6:],
        {"role": "user", "content": question}
    ]

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=HEADERS,
        json={
            "model": settings.openai_model,
            "messages": messages,
            "stream": True,
            "temperature": 0.3,
            "max_tokens": 800,
        },
        stream=True,
        timeout=60
    )
    response.raise_for_status()

    for line in response.iter_lines():
        if line:
            line = line.decode("utf-8")
            if line.startswith("data: "):
                data = line[6:]
                if data == "[DONE]":
                    return
                try:
                    chunk = json.loads(data)
                    delta = chunk["choices"][0]["delta"]
                    if "content" in delta:
                        yield delta["content"]
                except json.JSONDecodeError:
                    continue