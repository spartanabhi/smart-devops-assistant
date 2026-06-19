# Smart DevOps Assistant: Project Overview

## 1. Problem Statement
Modern application infrastructure generates immense volumes of telemetry and log data. When an incident occurs, DevOps engineers spend critical minutes or hours manually parsing logs, identifying root causes, and formulating remediation steps. The delay in investigation leads to extended system downtime and violates SLAs.

## 2. Architecture
The Smart DevOps Assistant operates as an Agentic AIOps platform.
- **Frontend**: A React-based UI (planned/mocked) for visualization and human interaction.
- **Backend API**: A FastAPI service handling high-throughput log ingestion, asynchronous tasks, and integration endpoints.
- **Database Layer**: PostgreSQL stores structured incident data, while `pgvector` enables vector similarity search (RAG) on historical incidents.
- **Agentic Engine**: Built with LangGraph, it orchestrates deterministic logic and Anthropic's Claude to autonomously formulate hypotheses, determine root causes, and generate actionable Markdown runbooks.
- **Integrations**: Integrates with GitHub to securely publish incident runbooks for tracking, and with Slack using Block Kit to request immediate human-in-the-loop approval.

## 3. Workflow
1. **Log Ingestion & Anomaly Detection**: Logs stream into the system, and thresholds trigger incident creation.
2. **Investigation & Root Cause Analysis**: The system extracts the anomalous logs, identifies the failing service, and traces cascade failures.
3. **AI Hypothesis Generation**: The LangGraph engine analyzes the root cause and formulates high-confidence hypotheses regarding the failure.
4. **Runbook Generation**: Using historical RAG matches and the current hypotheses, Claude generates a highly structured markdown runbook detailing immediate and long-term remediations.
5. **Publish & Notify**: The runbook is published to GitHub. A Slack alert is dispatched to the `#incidents` channel with an interactive "Approve" or "Reject" prompt.
6. **Approval**: The Slack interaction dynamically updates the incident state in the PostgreSQL database.

## 4. Features
- **Deterministic Root Cause Engine**: Safely parses logs for error spikes and timeouts to identify the exact failing node without relying entirely on LLM hallucinations.
- **Vector-based RAG**: Leverages `sentence-transformers` and `pgvector` to identify historically similar incidents to inform current mitigations.
- **AI Runbook Generation**: Automatic generation of Markdown runbooks.
- **Human-in-the-Loop Slack Approvals**: Interactive Slack Bot to gate execution or validate findings.
- **Automated GitHub Publishing**: Persistent documentation of every incident and its approved runbook.

## 5. Tech Stack
- **API Framework**: FastAPI (Python)
- **Database**: PostgreSQL with `pgvector`
- **ORM**: SQLAlchemy
- **AI/LLM**: Anthropic Claude 3.5 Sonnet
- **Agent Orchestration**: LangGraph / NetworkX
- **Integrations**: PyGithub, Slack Bolt
