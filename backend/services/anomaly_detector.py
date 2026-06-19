from collections import Counter
from typing import List

def detect_anomalies(log_entries: List[any]) -> dict:
    """
    Scans log entries and returns anomaly signals.
    Supports list of dictionaries or SQLAlchemy LogEntry objects.
    """
    # Standardize to list of dictionaries
    logs = []
    for e in log_entries:
        if isinstance(e, dict):
            logs.append(e)
        else:
            logs.append({
                "service_name": getattr(e, "service_name", "unknown"),
                "log_level": getattr(e, "log_level", "INFO"),
                "message": getattr(e, "message", ""),
                "raw_line": getattr(e, "raw_line", "")
            })

    errors = [e for e in logs if e["log_level"] in ["ERROR", "CRITICAL"]]
    warnings = [e for e in logs if e["log_level"] == "WARN"]
    total = len(logs)
    
    if total == 0:
        return {
            "has_anomaly": False,
            "error_rate": 0.0,
            "total_logs": 0,
            "error_count": 0,
            "warning_count": 0,
            "affected_services": [],
            "top_errors": [],
            "severity": "Low"
        }
        
    error_rate = len(errors) / total
    
    # Count which services have the most errors, excluding noise services
    NOISE_SERVICES = {"monitoring-service", "alert-service", "logging-service"}
    service_errors = Counter(e["service_name"] for e in errors if e["service_name"] not in NOISE_SERVICES)
    top_errors = Counter(e["message"][:80] for e in errors).most_common(5)
    affected_services = list(service_errors.keys())
    
    # Determine severity
    if error_rate > 0.3 or any(e["log_level"] == "CRITICAL" for e in errors):
        severity = "Critical"
    elif error_rate > 0.1:
        severity = "High"
    elif error_rate > 0.03:
        severity = "Medium"
    else:
        severity = "Low"
        
    return {
        "has_anomaly": error_rate > 0.03 or severity in ["High", "Critical"],
        "error_rate": round(error_rate * 100, 1),
        "total_logs": total,
        "error_count": len(errors),
        "warning_count": len(warnings),
        "affected_services": affected_services,
        "top_errors": [{"message": m, "count": c} for m, c in top_errors],
        "severity": severity
    }
