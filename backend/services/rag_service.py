import os
import logging
from sqlalchemy.orm import Session
from database.models import Incident
import numpy as np

# Set up logger
logger = logging.getLogger("smart-devops-assistant.rag-service")

# Initialize SentenceTransformer model
model = None
try:
    from sentence_transformers import SentenceTransformer
    logger.info("Initializing SentenceTransformer with all-MiniLM-L6-v2...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("SentenceTransformer initialized successfully.")
except Exception as e:
    logger.error(f"Failed to load SentenceTransformer: {e}. Falling back to mock embeddings.")
    model = None

def get_embedding(text: str) -> list:
    """
    Convert text to a vector (list of numbers) using SentenceTransformer ('all-MiniLM-L6-v2').
    """
    if model is None:
        # Return mock 384-dim vector for pgvector compat
        return [0.0] * 384
        
    try:
        # Generate 384-dimensional embedding
        embedding = model.encode(text)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return [0.0] * 384

def build_embedding_text(severity: str, root_cause: str, summary: str, hypotheses_json: str, recommended_action: str) -> str:
    """
    Constructs a combined text payload from incident components to be embedded.
    """
    sev = severity or "Unknown"
    rc = root_cause or "Unknown"
    sum_val = summary or ""
    hyp = hypotheses_json or "[]"
    rec = recommended_action or ""
    
    return f"""Severity: {sev}

Root Cause:
{rc}

Summary:
{sum_val}

Hypotheses:
{hyp}

Recommended Action:
{rec}"""

def parse_vector(vec) -> list:
    """
    Ensures vector is a list of floats, parsing it from a string representation if needed.
    """
    if vec is None:
        return []
    if isinstance(vec, str):
        try:
            return [float(x) for x in vec.strip('[]').split(',') if x.strip()]
        except Exception as e:
            logger.error(f"Error parsing vector string: {e}")
            return []
    if isinstance(vec, np.ndarray):
        return vec.tolist()
    if isinstance(vec, list):
        return vec
    try:
        if hasattr(vec, "tolist"):
            return vec.tolist()
        return list(vec)
    except Exception:
        return []

def retrieve_similar_incidents(current_incident: Incident, db: Session, limit: int = 5) -> list:
    """
    Retrieves the top N similar incidents to the given current_incident.
    Uses pgvector cosine similarity as the primary path, and falls back to numpy in-memory
    cosine similarity if pgvector is unavailable or fails.
    """
    query_vector = parse_vector(current_incident.embedding)
    if not query_vector:
        logger.warning(f"No embedding found for incident {current_incident.id}, cannot search similar.")
        return []
        
    try:
        # Primary path: pgvector cosine distance query
        # Cosine distance = 1 - cosine similarity
        distance_expr = Incident.embedding.cosine_distance(query_vector)
        results_with_distance = db.query(Incident, distance_expr).filter(
            Incident.id != current_incident.id,
            Incident.embedding != None
        ).order_by(
            distance_expr
        ).limit(limit).all()
        
        similar_incidents = []
        for r, dist in results_with_distance:
            similar_incidents.append({
                "incident_id": r.id,
                "similarity_score": round(1.0 - float(dist), 2),
                "summary": r.summary or "",
                "root_cause": r.root_cause or ""
            })
        return similar_incidents
        
    except Exception as e:
        logger.warning(f"pgvector similarity search failed, falling back to numpy: {e}")
        # Fallback path: fetch all other incidents and compute cosine similarity in Python
        all_other = db.query(Incident).filter(
            Incident.id != current_incident.id,
            Incident.embedding != None
        ).all()
        
        scored_incidents = []
        u = np.array(query_vector)
        u_norm = np.linalg.norm(u)
        if u_norm == 0:
            return []
            
        for r in all_other:
            v_val = parse_vector(r.embedding)
            if not v_val:
                continue
            v = np.array(v_val)
            v_norm = np.linalg.norm(v)
            if v_norm == 0:
                continue
            
            # Cosine similarity formula
            score = np.dot(u, v) / (u_norm * v_norm)
            scored_incidents.append((r, score))
            
        # Sort descending by similarity score
        scored_incidents.sort(key=lambda x: x[1], reverse=True)
        
        similar_incidents = []
        for r, score in scored_incidents[:limit]:
            similar_incidents.append({
                "incident_id": r.id,
                "similarity_score": round(float(score), 2),
                "summary": r.summary or "",
                "root_cause": r.root_cause or ""
            })
        return similar_incidents

def search_similar_incidents(query: str, db: Session, limit: int = 3) -> list:
    """
    Search past incidents similar to the current query text.
    Falls back to text-based search if vector search is unavailable.
    """
    query_vector = get_embedding(query)
    
    # Fallback to text search if query_vector is zero-filled (uninitialized model)
    if all(v == 0.0 for v in query_vector):
        try:
            results = db.query(Incident).filter(
                Incident.summary.ilike(f"%{query[:50]}%") |
                Incident.title.ilike(f"%{query[:50]}%")
            ).limit(limit).all()
            return [
                {
                    "id": r.id,
                    "title": r.title,
                    "severity": r.severity,
                    "root_cause": r.root_cause,
                    "summary": r.summary,
                    "runbook_url": r.runbook_url,
                    "created_at": str(r.created_at)
                }
                for r in results
            ]
        except Exception as e:
            logger.error(f"Error searching similar incidents: {e}")
            return []

    try:
        # Cosine distance query using pgvector
        distance_expr = Incident.embedding.cosine_distance(query_vector)
        results = db.query(Incident).filter(
            Incident.embedding != None
        ).order_by(
            distance_expr
        ).limit(limit).all()
        
        return [
            {
                "id": r.id,
                "title": r.title,
                "severity": r.severity,
                "root_cause": r.root_cause,
                "summary": r.summary,
                "runbook_url": r.runbook_url,
                "created_at": str(r.created_at)
            }
            for r in results
        ]
    except Exception as e:
        logger.warning(f"pgvector query failed in search_similar_incidents: {e}")
        # Fallback to numpy similarity
        all_other = db.query(Incident).filter(Incident.embedding != None).all()
        scored = []
        u = np.array(query_vector)
        u_norm = np.linalg.norm(u)
        if u_norm == 0:
            return []
            
        for r in all_other:
            v_val = parse_vector(r.embedding)
            if not v_val:
                continue
            v = np.array(v_val)
            v_norm = np.linalg.norm(v)
            if v_norm == 0:
                continue
            score = np.dot(u, v) / (u_norm * v_norm)
            scored.append((r, score))
            
        scored.sort(key=lambda x: x[1], reverse=True)
        return [
            {
                "id": r[0].id,
                "title": r[0].title,
                "severity": r[0].severity,
                "root_cause": r[0].root_cause,
                "summary": r[0].summary,
                "runbook_url": r[0].runbook_url,
                "created_at": str(r[0].created_at)
            }
            for r in scored[:limit]
        ]
