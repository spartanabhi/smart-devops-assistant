from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import QueryHistory, LogEntry
from services.rag_service import search_similar_incidents
import os
import logging

router = APIRouter()
logger = logging.getLogger("smart-devops-assistant.queries-api")

class QueryRequest(BaseModel):
    query: str

# Try to initialize Anthropic client
try:
    import anthropic
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key and not api_key.startswith("your_"):
        client = anthropic.Anthropic(api_key=api_key)
    else:
        client = None
except ImportError:
    client = None

@router.post("")
def query_devops_assistant(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Handle natural language query about logs/incidents.
    Retrieve related incidents using RAG search, fetch relevant logs,
    and prompt Claude to answer the query.
    """
    query_text = request.query
    if not query_text:
        raise HTTPException(status_code=400, detail="Query text cannot be empty")
        
    logger.info(f"Received NL Query: {query_text}")

    # 1. RAG Search over past incidents
    similar_incidents = search_similar_incidents(query_text, db, limit=2)
    incidents_context = "\n".join([
        f"- Incident: {i['title']}\n  Root Cause: {i['root_cause']}\n  Summary: {i['summary']}"
        for i in similar_incidents
    ])

    # 2. Fetch recent error logs context
    recent_errors = db.query(LogEntry).filter(
        LogEntry.log_level.in_(["ERROR", "CRITICAL"])
    ).order_by(LogEntry.id.desc()).limit(10).all()
    
    logs_context = "\n".join([
        f"[{e.service_name}] {e.log_level}: {e.message}"
        for e in recent_errors
    ])

    # 3. Call Claude to synthesize answer (or mock if key missing)
    ai_response = ""
    if client:
        prompt = f"""You are Smart DevOps Assistant, an expert SRE Copilot. Answer this query: "{query_text}"

PAST INCIDENTS CONTEXT (RAG):
{incidents_context if incidents_context else "No similar incidents found."}

RECENT LOG ERRORS:
{logs_context if logs_context else "No recent log errors found."}

Provide a concise, direct response answering the user's question. Suggest possible fixes."""
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}]
            )
            ai_response = response.content[0].text
        except Exception as e:
            logger.error(f"Claude request failed in queries api: {e}")
            ai_response = get_mock_ai_response(query_text, similar_incidents)
    else:
        ai_response = get_mock_ai_response(query_text, similar_incidents)

    # 4. Save to Query History
    history_entry = QueryHistory(
        user_query=query_text,
        ai_response=ai_response
    )
    db.add(history_entry)
    db.commit()

    return {
        "query": query_text,
        "response": ai_response,
        "rag_context_used": len(similar_incidents) > 0,
        "timestamp": history_entry.timestamp
    }

def get_mock_ai_response(query: str, similar_incidents: list) -> str:
    """Generates standard SRE mock responses for queries."""
    query_lower = query.lower()
    
    # Context-aware mock answers
    if "auth" in query_lower or "login" in query_lower:
        return (
            "Based on recent database logs, `auth-service` is experiencing connection pool exhaustion. "
            "I see repeated messages like `Connection pool exhausted: max_size=20`. "
            "This matches a similar historical incident where increasing the pool limit resolved the problem. "
            "\n\n**Recommendation**: Check the database connection pool settings in the `auth-service` deployment configuration "
            "and verify that connections are being closed correctly in your API endpoints."
        )
    elif "payment" in query_lower:
        return (
            "The `payment-service` is timing out because it is waiting for response from `auth-service` which is offline. "
            "The downstream error is `Timeout waiting for auth response (5000ms)`. "
            "\n\n**Recommendation**: Resolve the database connection issue in `auth-service` first. Once `auth-service` recovers, "
            "`payment-service` will resume normal operations. You may also want to implement a retry mechanism or circuit breaker."
        )
    else:
        return (
            f"Here is what I found regarding '{query}':\n\n"
            "Currently, the system is showing anomalies in the log pattern rate. "
            "The top errors indicate connection issues to database components. "
            "\n\n**Recommendation**: Inspect active database locks and check microservice network routes using docker-compose. "
            "Ensure the Postgres container is healthy and responding to queries."
        )
