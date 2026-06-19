import logging
import re

logger = logging.getLogger("smart-devops-assistant.root-cause-engine")

# Services to exclude from root cause and cascade analysis
EXCLUSIONS = {"monitoring-service", "alert-service", "logging-service"}

# Key phrases indicating infrastructure-level errors
INFRASTRUCTURE_PHRASES = [
    "connection refused",
    "database unreachable",
    "connection pool exhausted",
    "pool exhausted",
    "db-host",
    "connection failed",
    "out of memory",
    "oom",
    "disk full",
    "no space",
    "null pointer",
    "nullpointer",
    "segmentation fault",
    "segfault",
    "crash",
    "killed",
    "panic",
    "exception",
    "failed to start",
    "critical error",
    "unhandled rejection",
    "failed to connect"
]

# Key phrases indicating downstream cascade impact
CASCADE_PHRASES = [
    "timeout waiting",
    "timeout waiting for auth",
    "service unavailable",
    "upstream failure",
    "auth service down",
    "cannot process payment",
    "500 internal server error",
    "503 service unavailable"
]

def extract_error_reason(message: str) -> str:
    """
    Extracts a dynamic root cause reason from an error message
    by looking for Exception/Error classes or key phrases.
    """
    # Look for patterns like: NameError: name 'x' is not defined, or java.lang.NullPointerException
    # We can match: word.wordException or wordError
    match = re.search(r'\b([\w\.]+Exception|[\w\.]+Error)\b', message)
    if match:
        return match.group(1)
        
    # Look for common database/connection/out of memory errors
    msg_lower = message.lower()
    if "connection pool exhausted" in msg_lower or "pool exhausted" in msg_lower:
        return "Database connection pool exhausted"
    if "connection refused" in msg_lower or "db-host" in msg_lower or "failed to connect" in msg_lower:
        return "Database connection failures"
    if "unreachable" in msg_lower:
        return "Database unreachable"
    if "memory" in msg_lower or "oom" in msg_lower:
        return "Out of Memory (OOM) Crash"
    if "disk" in msg_lower or "space" in msg_lower:
        return "Disk Space Exhausted"
    if "null pointer" in msg_lower or "nullpointer" in msg_lower:
        return "Null Pointer Exception"
    if "segfault" in msg_lower or "segmentation fault" in msg_lower:
        return "Segmentation Fault Crash"
    if "syntax error" in msg_lower:
        return "SQL Syntax Error"
    if "permission denied" in msg_lower or "unauthorized" in msg_lower or "access denied" in msg_lower:
        return "Access Denied / Permission Error"
    if "timeout" in msg_lower:
        return "Timeout waiting for dependency"
        
    # If no specific pattern is found, clean up the first 60 characters of the message
    clean_msg = re.sub(r'uuid=[\w\-]+|id=\d+|token=\w+', '', message)  # remove dynamic IDs
    clean_msg = re.sub(r'\s+', ' ', clean_msg).strip()
    if len(clean_msg) > 60:
        return clean_msg[:57] + "..."
    return clean_msg or "Generic Application Failure"

def analyze_root_cause(log_entries: list) -> dict:
    """
    Deterministically analyze LogEntry records to determine:
    1. The root cause service
    2. The root cause reason
    3. Cascading affected services
    4. Confidence score
    """
    # Standardize input to dictionaries
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

    # Filter out empty or noise records
    logs = [l for l in logs if l["service_name"] not in EXCLUSIONS]

    if not logs:
        return {
            "root_cause_service": "Unknown",
            "root_cause_reason": "No logs available to analyze",
            "cascade": [],
            "confidence": 0
        }

    root_cause_service = "Unknown"
    root_cause_reason = "Generic application error"
    cascade = []
    confidence = 50

    # Rule 1 & 3: Find the first service emitting infrastructure errors chronologically
    first_infra_log = None
    for l in logs:
        # Check if the log level is ERROR or CRITICAL
        if l["log_level"] in ["ERROR", "CRITICAL"]:
            msg_lower = l["message"].lower()
            if any(phrase in msg_lower for phrase in INFRASTRUCTURE_PHRASES):
                first_infra_log = l
                break

    if first_infra_log:
        root_cause_service = first_infra_log["service_name"]
        
        # Determine specific reason text
        msg_lower = first_infra_log["message"].lower()
        if "connection pool exhausted" in msg_lower or "pool exhausted" in msg_lower:
            root_cause_reason = "Database connection pool exhausted"
        elif "connection refused" in msg_lower or "db-host" in msg_lower or "failed to connect" in msg_lower:
            root_cause_reason = "Database connection failures"
        elif "unreachable" in msg_lower:
            root_cause_reason = "Database unreachable"
        elif "memory" in msg_lower or "oom" in msg_lower:
            root_cause_reason = "Out of Memory (OOM) Crash"
        elif "disk" in msg_lower or "space" in msg_lower:
            root_cause_reason = "Disk Space Exhausted"
        elif "null pointer" in msg_lower or "nullpointer" in msg_lower:
            root_cause_reason = "Null Pointer Exception"
        elif "segfault" in msg_lower or "segmentation fault" in msg_lower:
            root_cause_reason = "Segmentation Fault Crash"
        else:
            root_cause_reason = extract_error_reason(first_infra_log["message"])
            
        # Confidence boosts
        confidence += 15  # Infrastructure match signal
    else:
        # Rule fallback: select first service that registers an error
        first_error_log = None
        for l in logs:
            if l["log_level"] in ["ERROR", "CRITICAL"]:
                first_error_log = l
                break
                
        if first_error_log:
            root_cause_service = first_error_log["service_name"]
            root_cause_reason = extract_error_reason(first_error_log["message"])

    # Rule 2: Identify cascade failures on other services
    # Any other service that reports error containing cascade patterns,
    # OR any error logged after the root cause started.
    cascade_services = set()
    root_cause_seen = False
    
    for l in logs:
        # Track when we encounter the root cause error
        if l["service_name"] == root_cause_service and l["log_level"] in ["ERROR", "CRITICAL"]:
            root_cause_seen = True
            
        if root_cause_seen and l["service_name"] != root_cause_service:
            if l["log_level"] in ["ERROR", "CRITICAL"]:
                msg_lower = l["message"].lower()
                # If it matches cascade keywords or is logged after the root cause
                if any(phrase in msg_lower for phrase in CASCADE_PHRASES) or l["service_name"] not in cascade_services:
                    cascade_services.add(l["service_name"])

    # Exclude noise and root cause from cascade list (just in case)
    cascade = [s for s in cascade_services if s != root_cause_service and s not in EXCLUSIONS]

    # Additional confidence metrics calculation
    if root_cause_service != "Unknown":
        # Check if the root cause service registers repeated errors
        root_error_count = sum(1 for l in logs if l["service_name"] == root_cause_service and l["log_level"] in ["ERROR", "CRITICAL"])
        if root_error_count >= 3:
            confidence += 15  # Repeated failures signal high correlation
            
        # Check if we have clear cascading impact
        if len(cascade) >= 2:
            confidence += 15  # Multi-service cascading errors validate propagation
            
        # Check if root cause occurred before cascade logs in timestamp order
        # Verify the index of the first root cause error is lower than first cascade error
        root_idx = -1
        cascade_idx = len(logs)
        
        for idx, l in enumerate(logs):
            if l["service_name"] == root_cause_service and l["log_level"] in ["ERROR", "CRITICAL"]:
                if root_idx == -1:
                    root_idx = idx
            elif l["service_name"] in cascade and l["log_level"] in ["ERROR", "CRITICAL"]:
                if idx < cascade_idx:
                    cascade_idx = idx
                    
        if root_idx != -1 and root_idx < cascade_idx:
            confidence += 10  # Temporal precedence confirmed

    # Cap confidence score at 95%
    confidence = min(confidence, 95)

    return {
        "root_cause_service": root_cause_service,
        "root_cause_reason": root_cause_reason,
        "cascade": cascade,
        "confidence": confidence
    }
