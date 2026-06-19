from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Incident, Investigation, LogEntry
import json
from services.rag_service import retrieve_similar_incidents
from services.root_cause_engine import analyze_root_cause
from agents.runbook_generator import generate_runbook
from services.github_service import publish_runbook

router = APIRouter()

class GenerateRunbookRequest(BaseModel):
    incident_id: int

@router.post("/generate")
def create_runbook_endpoint(request: GenerateRunbookRequest, db: Session = Depends(get_db)):
    # 1. Fetch Incident
    incident = db.query(Incident).filter(Incident.id == request.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    # 2. Fetch Investigation for Hypotheses
    investigation = db.query(Investigation).filter(Investigation.incident_id == request.incident_id).order_by(Investigation.created_at.desc()).first()
    hypotheses = []
    if investigation and investigation.hypotheses_json:
        try:
            hypotheses = json.loads(investigation.hypotheses_json)
        except Exception:
            pass

    # 3. Fetch Root Cause Data
    recent_logs = db.query(LogEntry).order_by(LogEntry.id.desc()).limit(100).all()
    logs = list(reversed(recent_logs))
    rc_result = analyze_root_cause(logs) if logs else {
        "root_cause_service": incident.root_cause,
        "root_cause_reason": "Unknown",
        "cascade": []
    }
    rc_result["root_cause_service"] = incident.root_cause or rc_result.get("root_cause_service", "Unknown")

    # 4. Fetch Historical Matches
    historical_matches = retrieve_similar_incidents(incident, db, limit=5)
    
    incident_data = {
        "id": incident.id,
        "title": incident.title,
        "severity": incident.severity,
        "summary": incident.summary,
        "created_at": str(incident.created_at)
    }

    # Generate Runbook Local
    result = generate_runbook(incident_data, rc_result, hypotheses, historical_matches)
    
    # 5. Publish to GitHub
    github_meta = publish_runbook(result["filename"], result["runbook_markdown"])
    
    # 6. Store GitHub URL and metadata in Incident
    incident.runbook_url = github_meta.get("github_url")
    incident.github_commit_sha = github_meta.get("github_commit_sha")
    incident.github_file_path = github_meta.get("github_file_path")
    incident.published_at = github_meta.get("published_at")
    
    db.add(incident)
    db.commit()
    
    result["github_url"] = incident.runbook_url
    
    return result

@router.get("/history")
def get_runbook_history(db: Session = Depends(get_db)):
    # Return latest 20 runbooks
    incidents = db.query(Incident).filter(Incident.runbook_url != None).order_by(Incident.published_at.desc(), Incident.created_at.desc()).limit(20).all()
    
    return [
        {
            "incident_id": inc.id,
            "filename": inc.github_file_path.split("/")[-1] if inc.github_file_path else f"incident_{inc.id}.md",
            "github_url": inc.runbook_url,
            "generated_at": str(inc.published_at or inc.created_at)
        }
        for inc in incidents
    ]

@router.get("/{incident_id}")
def get_runbook(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident.runbook_url:
        raise HTTPException(status_code=404, detail="No runbook generated for this incident")
        
    import os
    filename = incident.github_file_path.split("/")[-1] if incident.github_file_path else f"incident_{incident_id}.md"
    
    api_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(api_dir)
    
    paths_to_try = [
        os.path.join(backend_dir, "runbooks", filename),
        os.path.join(os.path.dirname(backend_dir), "runbooks", filename),
        os.path.join("/", "runbooks", filename)
    ]
    
    markdown_content = ""
    for path in paths_to_try:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    markdown_content = f.read()
                break
            except Exception:
                pass
                
    # If not found on disk, fallback to a clean deterministic message or github reference
    if not markdown_content:
        markdown_content = f"# Runbook for Incident #{incident.id}\n\nLocal file `{filename}` could not be read on SRE container. Please view on GitHub at: [GitHub Runbook Link]({incident.runbook_url})"

    return {
        "incident_id": incident.id,
        "filename": filename,
        "github_url": incident.runbook_url,
        "generated_at": str(incident.published_at or incident.created_at),
        "runbook_markdown": markdown_content
    }
