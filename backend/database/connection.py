import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get DATABASE_URL from env
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://devops:devops123@localhost:5432/devopsdb"
)

# Connect engine. We can customize pool size for production-grade.
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# To import Models and register tables
from .models import Base

def init_db():
    """Initializes tables in database."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """FastAPI dependency to yield db sessions and close them afterward."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
