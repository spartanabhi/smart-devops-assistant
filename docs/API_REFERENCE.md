# Smart DevOps Assistant: API Reference

## 1. Logs & Ingestion
### `POST /api/logs/ingest`
Ingests a stream of application logs.
- **Request Body**: `{"service_name": "auth-service", "level": "ERROR", "message": "Connection refused"}`
- **Response**: `{"status": "ok", "ingested": 1}`

## 2. Incidents & Metrics
### `GET /api/incidents/`
Retrieves recent incidents.
- **Response**: List of `Incident` objects with severity, summary, and root cause.

### `GET /api/incidents/{incident_id}`
Retrieves a specific incident.

### `POST /api/incidents/similar`
Searches historical incidents using vector similarity (RAG).
- **Request Body**: `{"incident_id": 1}`
- **Response**: List of similar incidents with similarity scores.

## 3. Investigations
### `POST /api/incidents/hypotheses` (or `/api/investigations/hypotheses`)
Triggers the LangGraph engine to generate hypotheses for an incident.
- **Request Body**: `{"incident_id": 1}`
- **Response**: `{"hypotheses": [...]}`

### `GET /api/investigations/{incident_id}`
Retrieves the latest investigation for a given incident.
- **Response**: Investigation details including JSON parsed hypotheses.

### `GET /api/investigations/history`
Retrieves the latest 20 investigations.

## 4. Runbooks
### `POST /api/runbooks/generate`
Generates a markdown runbook using AI and publishes it to GitHub.
- **Request Body**: `{"incident_id": 1}`
- **Response**: `{"filename": "...", "runbook_markdown": "...", "github_url": "..."}`

### `GET /api/runbooks/{incident_id}`
Retrieves the published runbook metadata for an incident.

### `GET /api/runbooks/history`
Retrieves the latest 20 generated runbooks.

## 5. Slack Integration
### `POST /api/slack/send-alert`
Sends an interactive incident alert to Slack.
- **Request Body**: `{"incident_id": 1}`
- **Response**: `{"sent": true, "channel": "#incidents"}`

### `POST /slack/actions`
Handles interactive payload callbacks from Slack (e.g., `approve_runbook`, `reject_runbook`).
- **Note**: Requires valid Slack Signature verification.
