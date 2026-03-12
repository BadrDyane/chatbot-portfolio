"""
admin.py — Admin routes for document management.
Full implementation in Day 2.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
def admin_ping():
    return {"message": "Admin router is working"}