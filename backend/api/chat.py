"""
chat.py — Chat routes for user conversations.
Full implementation in Day 3.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/ping")
def chat_ping():
    return {"message": "Chat router is working"}