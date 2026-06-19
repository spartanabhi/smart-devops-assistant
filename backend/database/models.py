from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from pgvector.sqlalchemy import Vector
from datetime import datetime

# Declare SQLAlchemy base model
Base = declarative_base()

class LogEntry(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    service_name = Column(String(100), index=True)
    log_level = Column(String(10), index=True)  # ERROR, WARN, INFO, DEBUG
    message = Column(Text)
    raw_line = Column(Text)


class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    severity = Column(String(20), index=True)  # Critical, High, Medium, Low
    root_cause = Column(Text)
    summary = Column(Text)
    runbook_url = Column(String(500), nullable=True)
    github_commit_sha = Column(String(40), nullable=True)
    github_file_path = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True)
    runbook_status = Column(String(20), default="pending")
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    slack_message_ts = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    embedding = Column(Vector(384), nullable=True)  # For RAG similarity search


class QueryHistory(Base):
    __tablename__ = "queries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_query = Column(Text)
    ai_response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)


class Investigation(Base):
    __tablename__ = "investigations"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    root_cause_service = Column(String(100), index=True)
    recommended_action = Column(Text)
    hypotheses_json = Column(Text)  # Stores serialized JSON hypotheses
    confidence_summary = Column(String(255))

