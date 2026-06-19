import os
import json
import logging
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END

logger = logging.getLogger("smart-devops-assistant.hypothesis-agent")

# Initialize Google Gemini SDK if key is configured
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

# Define LangGraph workflow state
class AgentState(TypedDict):
    anomaly_data: Dict[str, Any]
    root_cause_data: Dict[str, Any]
    log_entries: List[Dict[str, Any]]
    context: str
    hypotheses: List[Dict[str, Any]]
    recommended_action: str
    root_cause_service: str
    cascade: List[str]

# ====================================================
# LANGGRAPH NODE FUNCTIONS
# ====================================================

def prepare_context(state: AgentState) -> Dict[str, Any]:
    """Node 1: Format logs and anomaly/root cause data into context string."""
    anomaly = state["anomaly_data"]
    rc = state["root_cause_data"]
    logs = state["log_entries"]
    
    # Exclude noise services from logs formatting
    EXCLUSIONS = {"monitoring-service", "alert-service", "logging-service"}
    clean_logs = [l for l in logs if l.get("service_name") not in EXCLUSIONS]
    
    log_summary_lines = []
    for l in clean_logs[-50:]:  # Last 50 relevant lines
        log_summary_lines.append(
            f"[{l.get('timestamp')}] {l.get('log_level')} {l.get('service_name')}: {l.get('message')}"
        )
    logs_context = "\n".join(log_summary_lines)

    context_str = f"""ANOMALY SUMMARY:
- Error Rate: {anomaly.get('error_rate')}%
- Severity: {anomaly.get('severity')}
- Affected Services: {', '.join(anomaly.get('affected_services', []))}

ROOT CAUSE ANALYSIS DETAILS:
- Probable Root Cause Service: {rc.get('root_cause_service')}
- Diagnostic Reason: {rc.get('root_cause_reason')}
- Cascade Failures: {', '.join(rc.get('cascade', []))}

LOG LINES CONTEXT:
{logs_context}"""

    # Populate state modifications
    return {
        "context": context_str,
        "root_cause_service": rc.get("root_cause_service", "Unknown"),
        "cascade": rc.get("cascade", [])
    }

def generate_hypotheses(state: AgentState) -> Dict[str, Any]:
    """Node 2: Formulate exactly 4 hypotheses using Claude or deterministic fallback."""
    hypotheses = []
    
    # Try using Claude if client is configured
    if client:
        prompt = f"""You are an expert Site Reliability Engineer (SRE). Review this diagnostic context:
{state['context']}

Generate exactly 4 distinct hypotheses explaining the root cause of this incident.
For each hypothesis, provide a short title and a description.

Respond ONLY with valid JSON in this exact schema format:
[
  {{
    "id": 1,
    "title": "Title of hypothesis",
    "description": "Short description of what failed and why (1-2 sentences)"
  }},
  ...
]"""
        try:
            response = client.generate_content(prompt)
            result_text = response.text
            # Clean JSON bounds
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            hypotheses = json.loads(result_text)
        except Exception as e:
            logger.error(f"Gemini failed during generate_hypotheses node: {e}. Falling back.")
            hypotheses = []

    # Fallback if Gemini is not configured or failed
    if not hypotheses or len(hypotheses) != 4:
        hypotheses = [
            {
                "id": 1,
                "title": "Database connection pool exhausted",
                "description": "The authentication service ran out of available connections in its connection pool due to a sudden traffic spike or unreleased connections."
            },
            {
                "id": 2,
                "title": "Database host unreachable",
                "description": "A networking timeout or host outage occurred between the application network and database server host."
            },
            {
                "id": 3,
                "title": "Authentication service dependency failure",
                "description": "Downstream services failed to authenticate requests because the auth-service endpoints returned connection errors."
            },
            {
                "id": 4,
                "title": "Upstream service cascade failure",
                "description": "The API gateway suffered cascading timeouts and returned 503 errors because backend payment and auth components stopped responding."
            }
        ]

    # Initialize placeholders for evidence and confidence
    for h in hypotheses:
        h["evidence"] = []
        h["confidence"] = 0

    return {"hypotheses": hypotheses}

def extract_evidence(state: AgentState) -> Dict[str, Any]:
    """Node 3: Find supporting log evidence line matches for each hypothesis."""
    hypotheses = state["hypotheses"]
    logs = state["log_entries"]
    
    # Exclude noise services from evidence scanning
    EXCLUSIONS = {"monitoring-service", "alert-service", "logging-service"}
    clean_logs = [l for l in logs if l.get("service_name") not in EXCLUSIONS]

    for h in hypotheses:
        evidence_lines = []
        hid = h["id"]
        
        # Match log signatures based on hypothesis focus
        for l in clean_logs:
            raw_line = l.get("raw_line", "")
            msg = l.get("message", "").lower()
            
            if hid == 1:  # Connection pool exhaustion
                if "pool exhausted" in msg or "max_size" in msg:
                    evidence_lines.append(raw_line)
            elif hid == 2:  # DB unreachable
                if "connection refused" in msg or "database unreachable" in msg:
                    evidence_lines.append(raw_line)
            elif hid == 3:  # Auth dependency failure
                if "timeout waiting for auth" in msg or "auth service down" in msg:
                    evidence_lines.append(raw_line)
            elif hid == 4:  # Gateway cascade
                if "500 internal server error" in msg or "503 service unavailable" in msg or "upstream failure" in msg:
                    evidence_lines.append(raw_line)

        # Store unique evidence lines (up to 3 matches for readability)
        h["evidence"] = list(set(evidence_lines))[:3]

    return {"hypotheses": hypotheses}

def score_confidence(state: AgentState) -> Dict[str, Any]:
    """Node 4: Compute confidence scoring metrics based on evidence matches."""
    hypotheses = state["hypotheses"]
    root_service = state["root_cause_service"]
    
    for h in hypotheses:
        evidence_count = len(h["evidence"])
        hid = h["id"]
        
        # Base confidence calculation
        if evidence_count > 0:
            score = 50 + min(evidence_count * 15, 30)
        else:
            score = 15
            
        # Context bonuses
        if hid == 1 and root_service == "auth-service":
            score += 15  # Root Cause service correlation
        elif hid == 2 and root_service == "auth-service":
            score += 10
            
        # Cap confidence between 10% and 95%
        h["confidence"] = min(max(score, 10), 95)
        
    return {"hypotheses": hypotheses}

def generate_recommendation(state: AgentState) -> Dict[str, Any]:
    """Node 5: Formulate remediation action steps based on primary hypothesis."""
    root_service = state["root_cause_service"]
    
    # Sort hypotheses by confidence
    sorted_h = sorted(state["hypotheses"], key=lambda x: x["confidence"], reverse=True)
    top_h = sorted_h[0] if sorted_h else None
    
    if top_h and top_h["id"] in [1, 2]:
        action = f"Increase database connection pool size and verify database connectivity for {root_service}"
    elif top_h and top_h["id"] == 3:
        action = f"Verify health of {root_service} container and check database network routes"
    else:
        action = "Check container resources and verify microservice communication network routes"
        
    return {"recommended_action": action}

# ====================================================
# LANGGRAPH WORKFLOW SETUP
# ====================================================

# Initialize Graph
graph_builder = StateGraph(AgentState)

# Add Node definitions
graph_builder.add_node("prepare_context", prepare_context)
graph_builder.add_node("generate_hypotheses", generate_hypotheses)
graph_builder.add_node("extract_evidence", extract_evidence)
graph_builder.add_node("score_confidence", score_confidence)
graph_builder.add_node("generate_recommendation", generate_recommendation)

# Add Edge definitions
graph_builder.set_entry_point("prepare_context")
graph_builder.add_edge("prepare_context", "generate_hypotheses")
graph_builder.add_edge("generate_hypotheses", "extract_evidence")
graph_builder.add_edge("extract_evidence", "score_confidence")
graph_builder.add_edge("score_confidence", "generate_recommendation")
graph_builder.add_edge("generate_recommendation", END)

# Compile the graph
hypothesis_graph = graph_builder.compile()

def execute_hypothesis_agent(anomaly_data: dict, root_cause_data: dict, log_entries: list) -> dict:
    """Invokes the compiled LangGraph workflow process."""
    # Standardize logs to list of dictionaries
    logs = []
    for e in log_entries:
        if isinstance(e, dict):
            logs.append(e)
        else:
            logs.append({
                "timestamp": str(getattr(e, "timestamp", "")),
                "service_name": getattr(e, "service_name", "unknown"),
                "log_level": getattr(e, "log_level", "INFO"),
                "message": getattr(e, "message", ""),
                "raw_line": getattr(e, "raw_line", "")
            })

    initial_state = {
        "anomaly_data": anomaly_data,
        "root_cause_data": root_cause_data,
        "log_entries": logs,
        "context": "",
        "hypotheses": [],
        "recommended_action": "",
        "root_cause_service": "",
        "cascade": []
    }
    
    # Invoke State Graph execution
    final_state = hypothesis_graph.invoke(initial_state)
    
    return {
        "hypotheses": final_state["hypotheses"],
        "recommended_action": final_state["recommended_action"],
        "root_cause_service": final_state["root_cause_service"],
        "cascade": final_state["cascade"]
    }
