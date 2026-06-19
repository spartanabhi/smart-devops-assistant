import json
from datetime import datetime, timedelta
from database.connection import SessionLocal, init_db
from database.models import Incident, Investigation, LogEntry

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        count = db.query(Incident).count()
        if count > 0:
            print(f"Database already has {count} incidents. Skipping seeding.")
            return

        print("Seeding sample SRE incidents...")
        
        # 1. Incident 1: Verify Runbook Incident
        inc1 = Incident(
            title="Verify Runbook Incident",
            severity="High",
            root_cause="auth-service",
            summary="This is a test incident to verify runbook generation functionality.",
            runbook_url="https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_1.md",
            github_file_path="runbooks/incident_1.md",
            published_at=datetime.utcnow() - timedelta(hours=4),
            runbook_status="approved",
            approved_by="Yashveer Rai",
            approved_at=datetime.utcnow() - timedelta(hours=4),
            created_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(inc1)
        db.commit()
        db.refresh(inc1)

        inv1 = Investigation(
            incident_id=inc1.id,
            root_cause_service="auth-service",
            recommended_action="Restart the auth-service container and monitor pool connections.",
            confidence_summary="Primary Match: 90%",
            hypotheses_json=json.dumps([
                {
                    "id": 1,
                    "title": "Database connection pool exhausted",
                    "description": "The auth-service ran out of database connections because the pool size limit was reached.",
                    "confidence": 90,
                    "evidence": ["System logs indicated an increase in error rates", "Anomaly metrics detected for auth-service"]
                }
            ]),
            created_at=datetime.utcnow() - timedelta(hours=4)
        )
        db.add(inv1)

        # 2. Incident 2: Anomaly spike in auth-service
        inc2 = Incident(
            title="Anomaly spike in auth-service",
            severity="Critical",
            root_cause="auth-service",
            summary="Database connection pool exhausted (max_size=20 reached). Connection refused to db-host:5432.",
            runbook_url="https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_2.md",
            github_file_path="runbooks/incident_2.md",
            published_at=datetime.utcnow() - timedelta(hours=3),
            runbook_status="approved",
            approved_by="Yashveer Rai",
            approved_at=datetime.utcnow() - timedelta(hours=3),
            created_at=datetime.utcnow() - timedelta(hours=3)
        )
        db.add(inc2)
        db.commit()
        db.refresh(inc2)

        inv2 = Investigation(
            incident_id=inc2.id,
            root_cause_service="auth-service",
            recommended_action="Increase connection pool size in auth-service configuration and verify pg_isready.",
            confidence_summary="Primary Match: 87%",
            hypotheses_json=json.dumps([
                {
                    "id": 1,
                    "title": "Database connection pool exhausted",
                    "description": "The auth-service ran out of database connections because the pool size limit was reached under heavy load.",
                    "confidence": 87,
                    "evidence": ["Connection pool exhausted: max_size=20 current=20", "Connection refused to db-host:5432"]
                },
                {
                    "id": 2,
                    "title": "Database host unreachable / Network partition",
                    "description": "A transient network partition occurred between the application container and the database container.",
                    "confidence": 65,
                    "evidence": ["Connection refused to db-host:5432"]
                }
            ]),
            created_at=datetime.utcnow() - timedelta(hours=3)
        )
        db.add(inv2)

        # 3. Incident 3: Anomaly spike in inventory-service
        inc3 = Incident(
            title="Anomaly spike in inventory-service",
            severity="Critical",
            root_cause="inventory-service",
            summary="Auth-service database connection failures. TCP port 5432 refused connections, causing downstream order-service cascade.",
            runbook_url="https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_3.md",
            github_file_path="runbooks/incident_3.md",
            published_at=datetime.utcnow() - timedelta(hours=2),
            runbook_status="approved",
            approved_by="Yashveer Rai",
            approved_at=datetime.utcnow() - timedelta(hours=2),
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(inc3)
        db.commit()
        db.refresh(inc3)

        inv3 = Investigation(
            incident_id=inc3.id,
            root_cause_service="inventory-service",
            recommended_action="Verify pg_isready and database server firewall rules.",
            confidence_summary="Primary Match: 95%",
            hypotheses_json=json.dumps([
                {
                    "id": 1,
                    "title": "Database connection failures",
                    "description": "Auth-service database connection failures. TCP port 5432 refused connections.",
                    "confidence": 95,
                    "evidence": ["Database connection refused auth-service", "TCP port 5432 refused connections"]
                }
            ]),
            created_at=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(inv3)

        # 4. Incident 4: Anomaly spike in cache-service
        inc4 = Incident(
            title="Anomaly spike in cache-service",
            severity="High",
            root_cause="cache-service",
            summary="Redis connection pool at 95% capacity causing timeouts on query console caching queries.",
            runbook_url="https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_4.md",
            github_file_path="runbooks/incident_4.md",
            published_at=datetime.utcnow() - timedelta(hours=1),
            runbook_status="approved",
            approved_by="Yashveer Rai",
            approved_at=datetime.utcnow() - timedelta(hours=1),
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add(inc4)
        db.commit()
        db.refresh(inc4)

        inv4 = Investigation(
            incident_id=inc4.id,
            root_cause_service="cache-service",
            recommended_action="Scale Redis maxclients parameter and clean eviction policies.",
            confidence_summary="Primary Match: 92%",
            hypotheses_json=json.dumps([
                {
                    "id": 1,
                    "title": "Redis Connection pool exhaustion",
                    "description": "Redis connection pool limit warning causing slight delay in request validation checks.",
                    "confidence": 92,
                    "evidence": ["Redis connection pool at 95% capacity", "Timeout waiting for auth response"]
                }
            ]),
            created_at=datetime.utcnow() - timedelta(hours=1)
        )
        db.add(inv4)

        db.commit()
        print("Successfully seeded database with 4 SRE incidents!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
