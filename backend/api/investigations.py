from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Investigation
import json
import logging

router = APIRouter()
logger = logging.getLogger("smart-devops-assistant.investigations-api")

@router.get("/history")
def get_investigations_history(db: Session = Depends(get_db)):
    """Retrieve the latest 20 investigations, ordered by created_at descending."""
    results = db.query(Investigation).order_by(Investigation.created_at.desc()).limit(20).all()
    
    formatted_history = []
    for r in results:
        try:
            hypotheses = json.loads(r.hypotheses_json) if r.hypotheses_json else []
        except Exception as e:
            logger.error(f"Failed to parse hypotheses JSON for investigation {r.id}: {e}")
            hypotheses = []
            
        formatted_history.append({
            "id": r.id,
            "incident_id": r.incident_id,
            "root_cause_service": r.root_cause_service,
            "recommended_action": r.recommended_action,
            "confidence_summary": r.confidence_summary,
            "hypotheses": hypotheses,
            "created_at": str(r.created_at)
        })
        
    return formatted_history

@router.get("/{incident_id}")
def get_latest_investigation(incident_id: int, db: Session = Depends(get_db)):
    """Retrieve the single latest investigation stored for a given incident_id."""
    r = db.query(Investigation).filter(Investigation.incident_id == incident_id).order_by(Investigation.created_at.desc()).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"No investigations found for incident ID {incident_id}")
        
    try:
        hypotheses = json.loads(r.hypotheses_json) if r.hypotheses_json else []
    except Exception as e:
        logger.error(f"Failed to parse hypotheses JSON for investigation {r.id}: {e}")
        hypotheses = []

    return {
        "id": r.id,
        "incident_id": r.incident_id,
        "root_cause_service": r.root_cause_service,
        "recommended_action": r.recommended_action,
        "confidence_summary": r.confidence_summary,
        "hypotheses": hypotheses,
        "created_at": str(r.created_at)
    }
