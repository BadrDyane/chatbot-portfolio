"""
database.py

Sets up the database connection using SQLAlchemy.
SQLAlchemy is an ORM (Object-Relational Mapper).
This means you work with Python objects instead of writing raw SQL.

We use SQLite for development because it requires no server.
The database is stored as a single file: data/chatbot.db
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path

# Ensure the data directory exists before trying to create the database file
Path("./data").mkdir(parents=True, exist_ok=True)

# SQLite connection string
# The three slashes mean "relative path"
DATABASE_URL = "sqlite:///./data/chatbot.db"

# The engine is the actual database connection
# check_same_thread=False is required for SQLite + FastAPI (which uses multiple threads)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# SessionLocal is a factory for creating database sessions
# Each request gets its own session (see get_db below)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base is the class all your database models will inherit from
Base = declarative_base()


def get_db():
    """
    Dependency function for FastAPI routes.

    Usage in a route:
        def my_route(db = Depends(get_db)):
            db.query(...)

    The "yield" pattern ensures the session is always closed
    after the request finishes, even if an error occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()