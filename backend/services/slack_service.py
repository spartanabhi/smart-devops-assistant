import os
import logging
from datetime import datetime
from slack_bolt import App
from slack_bolt.adapter.fastapi import SlackRequestHandler
from database.connection import SessionLocal
from database.models import Incident

logger = logging.getLogger("smart-devops-assistant.slack-service")

slack_token = os.getenv("SLACK_BOT_TOKEN")
slack_secret = os.getenv("SLACK_SIGNING_SECRET")
slack_channel = os.getenv("SLACK_CHANNEL", "#incidents")

if slack_token and slack_secret and not slack_token.startswith("xoxb-your"):
    try:
        slack_app = App(token=slack_token, signing_secret=slack_secret)
        handler = SlackRequestHandler(slack_app)
    except Exception as e:
        logger.error(f"Failed to initialize Slack Bolt App: {e}")
        slack_app = None
        handler = None
else:
    logger.warning("Slack Bot credentials are not configured or are placeholder values. Slack service will operate in mock mode.")
    slack_app = None
    handler = None

def _build_slack_blocks(incident_id, severity, root_cause, recommended_action, github_url):
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"🚨 *Incident Detected*\n\n*Severity:*\n{severity}\n\n*Root Cause:*\n{root_cause}\n\n*Recommended Action:*\n{recommended_action}\n\n*Runbook:*\n{github_url}"
            }
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "Approve Runbook"},
                    "style": "primary",
                    "action_id": "approve_runbook",
                    "value": str(incident_id)
                },
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "Reject Runbook"},
                    "style": "danger",
                    "action_id": "reject_runbook",
                    "value": str(incident_id)
                }
            ]
        }
    ]

def send_incident_alert(incident_id: int, severity: str, root_cause: str, recommended_action: str, github_runbook_url: str) -> bool:
    logger.info(f"Sending Slack alert for incident {incident_id} to channel {slack_channel}")
    
    if not slack_app:
        logger.warning(f"[Mock Slack Alert] 🚨 Incident Detected: {incident_id}")
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if incident:
                incident.slack_message_ts = "mock_ts_12345"
                incident.runbook_status = "pending"
                db.commit()
        finally:
            db.close()
        return False
        
    try:
        blocks = _build_slack_blocks(incident_id, severity, root_cause, recommended_action, github_runbook_url)
        response = slack_app.client.chat_postMessage(
            channel=slack_channel,
            text=f"🚨 Incident Detected: {root_cause}",
            blocks=blocks
        )
        
        ts = response["ts"]
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if incident:
                incident.slack_message_ts = ts
                incident.runbook_status = "pending"
                db.commit()
        finally:
            db.close()
            
        return True
    except Exception as e:
        logger.error(f"Failed to post Slack message: {e}")
        return False

if slack_app:
    @slack_app.action("approve_runbook")
    def handle_approve(ack, body, say, client):
        ack()
        incident_id = int(body["actions"][0]["value"])
        user_id = body["user"]["id"]
        channel_id = body["channel"]["id"]
        message_ts = body["message"]["ts"]
        
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if incident:
                incident.runbook_status = "approved"
                incident.approved_by = user_id
                incident.approved_at = datetime.utcnow()
                db.commit()
                
                client.chat_update(
                    channel=channel_id,
                    ts=message_ts,
                    text="✅ Runbook Approved",
                    blocks=[
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"✅ *Runbook Approved* by <@{user_id}>\n\n*Incident ID:* {incident_id}\n*Runbook:* {incident.runbook_url}"
                            }
                        }
                    ]
                )
        finally:
            db.close()

    @slack_app.action("reject_runbook")
    def handle_reject(ack, body, say, client):
        ack()
        incident_id = int(body["actions"][0]["value"])
        user_id = body["user"]["id"]
        channel_id = body["channel"]["id"]
        message_ts = body["message"]["ts"]
        
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if incident:
                incident.runbook_status = "rejected"
                incident.approved_by = user_id
                incident.approved_at = datetime.utcnow()
                db.commit()
                
                client.chat_update(
                    channel=channel_id,
                    ts=message_ts,
                    text="❌ Runbook Rejected",
                    blocks=[
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": f"❌ *Runbook Rejected* by <@{user_id}>\n\n*Incident ID:* {incident_id}\n*Runbook:* {incident.runbook_url}"
                            }
                        }
                    ]
                )
        finally:
            db.close()
