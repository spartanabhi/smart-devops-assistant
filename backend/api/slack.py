from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Incident, Investigation
from services.slack_service import send_incident_alert
import os

router = APIRouter()

class SendAlertRequest(BaseModel):
    incident_id: int

@router.post("/send-alert")
def trigger_slack_alert(request: SendAlertRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == request.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    investigation = db.query(Investigation).filter(Investigation.incident_id == request.incident_id).order_by(Investigation.created_at.desc()).first()
    
    recommended_action = "N/A"
    if investigation and investigation.recommended_action:
        recommended_action = investigation.recommended_action
        
    github_url = incident.runbook_url or "Not available"
    
    success = send_incident_alert(
        incident_id=incident.id,
        severity=incident.severity,
        root_cause=incident.root_cause,
        recommended_action=recommended_action,
        github_runbook_url=github_url
    )
    
    return {
        "sent": success,
        "channel": os.getenv("SLACK_CHANNEL", "#incidents")
    }
