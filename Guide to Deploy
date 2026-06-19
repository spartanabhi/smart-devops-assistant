# 🚀 Installation & Deployment Guide

This guide will help you run **Smart DevOps Assistant** locally or deploy it on AWS using your own credentials.

---

# 📋 Prerequisites

Before starting, make sure you have:

- Python 3.11+
- Node.js 20+
- Docker
- Docker Compose
- PostgreSQL 16+
- Git

Recommended:

- 16 GB RAM
- 4 CPU cores

---

# 📥 Clone Repository

```bash
git clone https://github.com/spartanabhi/smart-devops-assistant.git

cd smart-devops-assistant
```

---

# 🔑 Required Credentials

The platform integrates with:

| Service | Required | Purpose |
|----------|----------|----------|
| Anthropic Claude | Optional | AI Hypotheses & Runbooks |
| GitHub | Optional | Publish Runbooks |
| Slack | Optional | Incident Approval Workflow |
| PostgreSQL | Required | Database |
| AWS | Optional | Production Deployment |

---

# 🤖 Anthropic Claude Setup

Used for:

- AI Hypothesis Generation
- Root Cause Analysis
- Runbook Generation

## Get API Key

1. Go to https://console.anthropic.com
2. Create account
3. Generate API Key

Copy:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

---

# 🐙 GitHub Setup

Used for:

- Runbook Publishing
- Incident Documentation

## Create Personal Access Token

1. GitHub
2. Settings
3. Developer Settings
4. Personal Access Tokens
5. Generate New Token

Required permissions:

```text
repo
workflow
```

Example:

```env
GITHUB_TOKEN=github_pat_xxxxxxxxx

GITHUB_REPO=spartanabhi/smart-devops-assistant
```

---

# 💬 Slack Setup

Used for:

- Incident Notifications
- Runbook Approval Workflow

## Create Slack App

1. https://api.slack.com/apps
2. Create App
3. OAuth & Permissions
4. Add Bot Token Scopes:

```text
chat:write
commands
```

5. Install App to Workspace

Copy:

### Bot Token

```env
SLACK_BOT_TOKEN=xoxb-xxxxxxxx
```

### Signing Secret

```env
SLACK_SIGNING_SECRET=xxxxxxxx
```

### Channel ID

Example:

```env
SLACK_CHANNEL=C0123456789
```

---

# 🗄 PostgreSQL Setup

Create Database:

```sql
CREATE DATABASE devops_assistant;
```

Enable pgvector:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

# ⚙️ Environment Configuration

Create:

```bash
backend/.env
```

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/devops_assistant

ANTHROPIC_API_KEY=

GITHUB_TOKEN=
GITHUB_REPO=

SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_CHANNEL=

VITE_API_URL=http://localhost:8000

BACKEND_PUBLIC_URL=http://localhost:3000
```

---

# 🐳 Run Using Docker

## Build

```bash
docker compose build
```

## Start

```bash
docker compose up -d
```

## Stop

```bash
docker compose down
```

---

# 🌐 Application URLs

Frontend:

```text
http://localhost
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

# 💻 Local Development

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# ☁️ AWS Deployment

Recommended:

| Component | Recommendation |
|------------|----------------|
| EC2 | t3.medium |
| OS | Ubuntu 22.04 |
| RAM | 4 GB+ |
| Storage | 30 GB gp3 |

---

## Clone on EC2

```bash
git clone https://github.com/spartanabhi/smart-devops-assistant.git

cd smart-devops-assistant
```

---

## Configure Environment

```bash
nano backend/.env
```

Add all credentials.

---

## Start Containers

```bash
docker compose up -d --build
```

---

# 🌍 Elastic IP Configuration

Current Elastic IP:

```text
13.201.152.175
```

Update:

```env
VITE_API_URL=http://13.201.152.175/api

BACKEND_PUBLIC_URL=http://13.201.152.175
```

Rebuild:

```bash
docker compose down

docker compose build --no-cache

docker compose up -d
```

---

# 🧪 Test Incident Workflow

Create:

```text
test-incident.log
```

Upload via UI

OR

```bash
curl -X POST http://localhost:8000/api/logs/upload \
-F "file=@test-incident.log"
```

---

# 🔄 Expected Workflow

```text
Upload Logs
      ↓
Log Parsing
      ↓
Anomaly Detection
      ↓
Root Cause Analysis
      ↓
AI Hypothesis Agent
      ↓
RAG Similar Incidents
      ↓
Runbook Generation
      ↓
GitHub Publishing
      ↓
Slack Alert
      ↓
Approve / Reject
```

---

# 📖 Slack Approval Flow

When an incident occurs:

```text
🚨 Incident Detected
```

Slack receives:

```text
Severity: Critical

Root Cause:
auth-service

Recommended Action:
Increase database connection pool

Runbook:
https://github.com/...
```

Buttons:

```text
[Approve Runbook]

[Reject Runbook]
```

### Approve

```text
runbook_status = approved
```

### Reject

```text
runbook_status = rejected
```

---

# 🛠 Troubleshooting

## Runbook Not Generated

Verify:

```env
ANTHROPIC_API_KEY
```

and

```env
GITHUB_TOKEN
```

---

## Slack Not Working

Verify:

```env
SLACK_BOT_TOKEN

SLACK_SIGNING_SECRET

SLACK_CHANNEL
```

---

## Database Errors

Verify:

```env
DATABASE_URL
```

and ensure:

```sql
CREATE EXTENSION vector;
```

has been executed.

---

# 📊 Architecture

```text
Logs
 ↓
Anomaly Detection
 ↓
Root Cause Engine
 ↓
LangGraph Agent
 ↓
RAG Memory Layer
 ↓
Runbook Generator
 ↓
GitHub Publisher
 ↓
Slack Approval Workflow
 ↓
Human Approval
```

---

# 👨‍💻 Author

**Yashveer Rai**

B.Tech CSE (Cloud Computing & Automation)

VIT Bhopal University

GitHub:
https://github.com/spartanabhi

---

⭐ If you found this project useful, consider starring the repository.
