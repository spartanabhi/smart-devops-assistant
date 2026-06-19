import os
import logging
from datetime import datetime
import json

logger = logging.getLogger("smart-devops-assistant.runbook-generator")

try:
    import google.generativeai as genai
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and not api_key.startswith("your_"):
        genai.configure(api_key=api_key)
        client = genai.GenerativeModel('gemini-1.5-flash')
    else:
        client = None
except ImportError:
    client = None

def generate_runbook(incident_data, root_cause_data, hypotheses, historical_matches) -> dict:
    """
    Generates a structured Markdown runbook and saves it locally.
    Returns {"filename": filename, "runbook_markdown": content}
    """
    title = incident_data.get("title", "Unknown Incident")
    incident_id = incident_data.get("id", "Unknown")
    
    timestamp = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
    filename = f"incident_{incident_id}.md"
    
    content = ""
    
    if client:
        try:
            content = _generate_with_gemini(incident_data, root_cause_data, hypotheses, historical_matches)
        except Exception as e:
            logger.error(f"Gemini runbook generation failed: {e}")
            content = _generate_deterministic(incident_data, root_cause_data, hypotheses, historical_matches)
    else:
        content = _generate_deterministic(incident_data, root_cause_data, hypotheses, historical_matches)
        
    # Write Locally (handles both local dev folder structure and docker /app structure)
    agents_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(agents_dir)
    if os.path.basename(backend_dir) == "app" or os.path.exists("/.dockerenv"):
        runbooks_dir = os.path.join(backend_dir, "runbooks")
    else:
        runbooks_dir = os.path.join(os.path.dirname(backend_dir), "runbooks")
        
    os.makedirs(runbooks_dir, exist_ok=True)
    local_path = os.path.join(runbooks_dir, filename)
    
    try:
        with open(local_path, "w", encoding="utf-8") as f:
            f.write(content)
        logger.info(f"Saved runbook locally to: {local_path}")
    except Exception as e:
        logger.error(f"Failed to write runbook locally: {e}")
        
    return {
        "filename": filename,
        "runbook_markdown": content
    }

def _build_context_text(incident_data, root_cause_data, hypotheses, historical_matches) -> str:
    ctx = f"Incident: {incident_data.get('title')}\n"
    ctx += f"Severity: {incident_data.get('severity')}\n"
    ctx += f"Summary: {incident_data.get('summary')}\n"
    ctx += f"Root Cause Service: {root_cause_data.get('root_cause_service')}\n"
    ctx += f"Root Cause Reason: {root_cause_data.get('root_cause_reason')}\n"
    ctx += f"Cascade: {', '.join(root_cause_data.get('cascade', []))}\n\n"
    
    ctx += "Hypotheses:\n"
    for h in hypotheses:
        ctx += f"- {h.get('title')} (Confidence: {h.get('confidence')}%): {h.get('description')}\n"
        
    ctx += "\nHistorical Matches:\n"
    for m in historical_matches:
        ctx += f"- ID: {m.get('incident_id')} (Score: {m.get('similarity_score')}): {m.get('root_cause')} - {m.get('summary')}\n"
        
    return ctx

def _generate_with_gemini(incident_data, root_cause_data, hypotheses, historical_matches) -> str:
    prompt = f"""Write a structured incident runbook in Markdown format based on the following context:

{_build_context_text(incident_data, root_cause_data, hypotheses, historical_matches)}

Include exactly these sections:
# Incident Runbook
## Executive Summary
## Incident Details
## Root Cause Analysis
## Evidence Collected
## AI Hypotheses
## Historical Similar Incidents
## Immediate Remediation Steps
## Long-Term Prevention Measures
## Verification Checklist
## Lessons Learned

Make the Verification Checklist actionable with bullet points starting with 'Verify...'.
Ensure Historical Similar Incidents are listed.
Do not add other sections.
"""
    response = client.generate_content(prompt)
    return response.text

def _generate_deterministic(incident_data, root_cause_data, hypotheses, historical_matches) -> str:
    title = incident_data.get("title", "Unknown")
    sev = incident_data.get("severity", "Unknown")
    rc_service = root_cause_data.get("root_cause_service", "Unknown")
    cascade_str = ", ".join(root_cause_data.get("cascade", [])) or "None"
    
    hyp_md = ""
    for h in hypotheses:
        hyp_md += f"* **{h.get('title')}** (Confidence: {h.get('confidence')}%)\n  * {h.get('description')}\n"
    if not hyp_md: hyp_md = "* No hypotheses generated.\n"
        
    hist_md = ""
    for m in historical_matches:
        hist_md += f"* **Incident {m.get('incident_id')}** (Similarity: {m.get('similarity_score')})\n  * Root Cause: {m.get('root_cause')}\n  * Summary: {m.get('summary')}\n"
    if not hist_md: hist_md = "* No historical matches found.\n"
    
    return f"""# Incident Runbook

## Executive Summary
Incident: {title}
Severity: {sev}
System encountered an anomaly in {rc_service} causing issues across downstream services.

## Incident Details
* **ID**: {incident_data.get("id")}
* **Time**: {incident_data.get("created_at")}
* **Summary**: {incident_data.get("summary")}

## Root Cause Analysis
* **Service**: {rc_service}
* **Reason**: {root_cause_data.get("root_cause_reason", "Unknown")}
* **Cascade**: {cascade_str}

## Evidence Collected
* System logs indicated an increase in error rates.
* Anomaly metrics detected for {rc_service}.

## AI Hypotheses
{hyp_md}
## Historical Similar Incidents
{hist_md}
## Immediate Remediation Steps
1. Identify the failing container for {rc_service}.
2. Restart the {rc_service} service.
3. Check upstream dependencies and downstream clients for recovery.

## Long-Term Prevention Measures
1. Improve health checks for {rc_service}.
2. Set up auto-scaling rules based on error rates and resource usage.
3. Review timeouts for downstream services: {cascade_str}.

## Verification Checklist
* Verify database connectivity
* Verify {rc_service} health endpoint
* Verify connection pool utilization
* Verify downstream services ({cascade_str}) recovery
* Verify API gateway error rate is nominal

## Lessons Learned
* Enhance monitoring and alerting thresholds for {rc_service}.
* Structured logging should be strictly enforced.
"""
