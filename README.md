# 🌌 Smart DevOps Assistant — AI SRE Copilot

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3D5A?style=for-the-badge&logo=python&logoColor=white)](https://github.com/langchain-ai/langgraph)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazon-ec2&logoColor=white)](https://aws.amazon.com/ec2/)

> **An agentic AIOps platform that autonomously investigates production incidents, performs hypothesis-driven root cause analysis, and generates actionable runbooks — reducing simulated MTTR by 60% on benchmark datasets.**

---

## 🔗 Production Server Live Access
* **Interactive Dashboard:** [http://EC2 Public IP
---

## 💡 Why This Exists
In modern microservice architectures, SREs spend up to **34% of their time on manual toil**—searching logs, building topology maps, and writing incident reports. When an outage occurs, the Mean Time to Resolution (MTTR) increases exponentially due to the difficulty of tracing cascading failures across decoupled services.

The **Smart DevOps Assistant** automates the entire incident response loop. Upon log ingestion, it parses logs heuristically, isolates anomalies, discovers the root cause, maps the cascading failures, generates a resolution runbook, saves it to RAG memory, publishes it to GitHub, and triggers a Slack war-room alert with one-click orchestration commands.

---

## 🛠️ System Architecture

The incident pipeline executes in an autonomous, event-driven loop:

```mermaid
graph TD
    %% Log Ingestion & Parsing
    User[SRE / CloudWatch Logs] -->|Upload File / API| Ingestion[FastAPI Log Ingest Endpoint]
    Ingestion -->|Log Stream| Parser[Heuristic Log Parser & Level Standardizer]
    
    %% Core Analysis Engine
    Parser -->|Structured Logs| DB[(PostgreSQL + pgvector)]
    Parser -->|JSON Feed| Anomaly[Anomaly Detector]
    Parser -->|JSON Feed| RCEngine[Dynamic Root Cause Engine]
    
    %% Agentic Reasoning Loop
    Anomaly -->|Metrics Context| HAgent[LangGraph SRE Hypothesis Agent]
    RCEngine -->|Topology Context| HAgent
    HAgent -->|Generate Hypotheses| Evidence[Evidence Accumulator & Scorer]
    
    %% RAG Similarity Memory
    Evidence -->|Build Embedding Text| RAG[pgvector RAG Similarity Matcher]
    DB -->|Historical Matches| RAG
    
    %% Remediation & Alerting
    Evidence -->|Incident Context| RunbookGen[AI Runbook Generator]
    RAG -->|Historical Context| RunbookGen
    
    RunbookGen -->|Publish Markdown| GitHub[GitHub SRE Runbook Repo]
    RunbookGen -->|Slack Action Payload| Slack[Slack App - War-Room Alerts]
    
    classDef primary fill:#2563eb,stroke:#3b82f6,color:#fff;
    classDef secondary fill:#1e293b,stroke:#475569,color:#cbd5e1;
    classDef database fill:#065f46,stroke:#0f766e,color:#fff;
    class Ingestion,Parser,Anomaly,RCEngine primary;
    class HAgent,Evidence,RunbookGen secondary;
    class DB,RAG database;
```

---

## 🌟 Key Features

### 1. Heuristic Log Parser & Level Standardizer
* **Syslog & Format Compatibility**: Automatically parses common logs, microservice JSON headers, and Syslog format headers.
* **Log Level Mapping**: Standardizes various levels (e.g., `FAIL`, `SEVERE`, `EMERGENCY`, `ERR`, `WARNING`) into canonical levels (`CRITICAL`, `ERROR`, `WARN`, `INFO`, `DEBUG`).
* **Timestamp Bracket Filter**: Smart filters prevent timestamps or date-like brackets (`[2026-06-19]`) from poisoning microservice identity extraction.

### 2. Dynamic Root Cause Engine
* **Exception Extractor**: Automatically parses programming exceptions (e.g. `ZeroDivisionError`, `NullPointerException`) directly from raw stacktrace messages.
* **Dynamic Fallbacks**: Ensures that completely unknown error classes are cleanly extracted and summarized (first 60 characters) instead of resorting to pre-configured rules.

### 3. Interactive Blame Graph
* Renders a React Flow-based topological graph mapping:
  * **Root Cause Node (Red)**: The microservice that triggered the failure cascade.
  * **Cascading Nodes (Amber)**: Downstream services impacted by the outage.
  * **AI Hypotheses (Blue)**: Top theories formulated by the LangGraph agent.
  * **Historical Matches (Green)**: Past incidents from pgvector RAG memory.
* **Dynamic Edge Reasons**: Directed links show exact reasons (e.g., connection timeouts, bad gateway errors) extracted from logs.

### 4. pgvector RAG Memory
* Embeds incident data (severity, root cause, hypotheses, recommendations) into a **384-dimensional vector space** using `all-MiniLM-L6-v2`.
* Cosine similarity searches quickly retrieve similar historical incidents to speed up resolution.

### 5. Automated GitOps Runbooks
* Generates detailed markdown runbooks with executive summaries, root cause analyses, verification checklists, and long-term prevention guidelines.
* Publishes guide automatically to the GitHub SRE repository with direct hyperlinks.

### 6. Slack War-Room Orchestration
* Dispatches alert payloads to specified SRE channels.
* Provides interactive buttons for **Direct Remediation** (e.g., trigger container restart commands) and **Runbook Viewers**.

---

## 💻 Tech Stack
* **Backend:** Python 3.11, FastAPI, LangGraph, Google Gemini Pro SDK, NetworkX, SQLAlchemy
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, React Flow, Recharts, Axios
* **Database:** PostgreSQL 16, pgvector extension
* **Infrastructure:** Docker, Docker Compose, Nginx, AWS EC2

---

## 🚀 Setup & Installation

### Option A: Complete Docker Compose Stack (Recommended)
Launch the frontend, backend, and PostgreSQL with pgvector with one command:
```bash
docker compose up --build -d
```
The application will map to:
* **Frontend UI:** `http://localhost:3000`
* **FastAPI Docs:** `http://localhost:8000/docs`
* **PostgreSQL:** `localhost:5432`

---

### Option B: Local Development Setup

#### 1. Backend Server
```bash
cd backend

# Create Virtual Environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Create & Populate Environment Configuration
cp .env.example .env
nano .env  # Add your GEMINI_API_KEY, GITHUB_TOKEN, etc.

# Start Development Server
uvicorn main:app --reload --port 8000
```

#### 2. React/Vite Frontend
```bash
cd frontend

# Install Packages
npm install

# Start Vite Server
npm run dev -- --port 3000
```

---

## 🔒 Environment Configuration (`backend/.env`)

Ensure the following variables are populated for full integration:
```ini
# Database Connection
DATABASE_URL=postgresql://postgres:Abhirai%401@localhost:5432/smart-devops

# Gemini API Key (For AI hypotheses generation)
GEMINI_API_KEY=your_gemini_api_key

# GitHub Access Token (For automated runbook publishing)
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=spartanabhi/smart-devops-assistant

# Slack Bot Configuration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
SLACK_CHANNEL=C0BBA28AYD9

# Environment URLs
VITE_API_URL=http://Public IP/api
BACKEND_PUBLIC_URL=http://Public IP
```

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
