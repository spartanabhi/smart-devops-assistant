import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables immediately
load_dotenv()

# Import routes
from api import logs, incidents, queries, investigations, runbooks, slack
from database.connection import init_db
from services.slack_service import handler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("smart-devops-assistant")

app = FastAPI(
    title="Smart DevOps Assistant API",
    description="Agentic AIOps & Incident Intelligence Platform API",
    version="1.0.0"
)

# Set up CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # In production, replace with specific domain names
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database on Startup
@app.on_event("startup")
def on_startup():
    logger.info("Initializing database schema...")
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # TODO: Implement proper database migration or retry mechanism

# Slack Interactivity Endpoint
@app.post("/slack/actions")
async def slack_actions(request: Request):
    if handler:
        return await handler.handle(request)
    return {"status": "inactive", "message": "Slack adapter is not initialized"}

# Include API Routers
app.include_router(logs.router, prefix="/api/logs", tags=["Logs Ingestion"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents & Metrics"])
app.include_router(queries.router, prefix="/api/queries", tags=["Natural Language Queries"])
app.include_router(investigations.router, prefix="/api/investigations", tags=["Investigations"])
app.include_router(runbooks.router, prefix="/api/runbooks", tags=["Runbooks"])
app.include_router(slack.router, prefix="/api/slack", tags=["Slack Integration"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Smart DevOps Assistant API",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
