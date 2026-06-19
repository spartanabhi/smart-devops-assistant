import re
from datetime import datetime
from typing import Optional

# These regex patterns match common log formats
LOG_PATTERNS = [
    # Format: [2026-06-18 14:03:21] ERROR service-name: message
    r'\[?(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]?\s+(ERROR|WARN|INFO|DEBUG|CRITICAL)\s+([\w\-\:\.]+):\s*(.*)',
    # Format: 2026-06-18T14:03:21Z ERROR service-name: message
    r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+(ERROR|WARN|INFO|DEBUG|CRITICAL)\s+([\w\-\:\.]+):\s*(.*)',
    # Format: Jun 18 14:03:21 hostname ERROR service: message
    r'(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([\w\-\.]+)\s+(ERROR|WARN|INFO|DEBUG|CRITICAL|WARNING)\s+([\w\-\:\.]+):\s*(.*)',
    # Format: Jun 18 14:03:21 hostname service: message (no explicit level, fallback to extracting it from message)
    r'(\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([\w\-\.]+)\s+([\w\-\:\.]+):\s*(.*)',
]

def standardize_log_level(level_str: str, line: str) -> str:
    """
    Standardize various log levels into canonical ERROR, CRITICAL, WARN, INFO, DEBUG.
    """
    level_upper = level_str.upper()
    if level_upper in ["ERROR", "ERR", "FAIL", "FAILURE", "FATAL", "SEVERE", "CRITICAL", "EMERGENCY", "ALERT"]:
        if level_upper in ["FATAL", "SEVERE", "CRITICAL", "EMERGENCY", "ALERT"]:
            return "CRITICAL"
        return "ERROR"
    if level_upper in ["WARN", "WARNING"]:
        return "WARN"
    if level_upper in ["INFO", "INFORMATION", "NOTICE", "OK", "SUCCESS"]:
        return "INFO"
    if level_upper in ["DEBUG", "TRACE"]:
        return "DEBUG"
        
    # Heuristically scan the line content for log level keywords
    line_upper = line.upper()
    for lvl in ["CRITICAL", "FATAL", "SEVERE", "EMERGENCY", "ALERT"]:
        if lvl in line_upper:
            return "CRITICAL"
    for lvl in ["ERROR", "FAIL", "FAILURE", "ERR"]:
        if lvl in line_upper:
            return "ERROR"
    for lvl in ["WARN", "WARNING"]:
        if lvl in line_upper:
            return "WARN"
    for lvl in ["DEBUG", "TRACE"]:
        if lvl in line_upper:
            return "DEBUG"
            
    return "INFO"  # Default fallback

def extract_service_name(line: str) -> str:
    """
    Heuristically extracts a service name from a log line
    when standard regex patterns do not match.
    """
    # 1. Look for service=... or app=... key-value pairs
    match = re.search(r'\b(?:service|app|logger|component|module)\s*=\s*[\'"]?([\w\-]+)[\'"]?', line, re.IGNORECASE)
    if match:
        return match.group(1).lower()
        
    # 2. Look for square brackets containing service name: e.g. [auth-service]
    # We ignore standard log level words in brackets
    for bracketed in re.findall(r'\[([\w\-]+)\]', line):
        val = bracketed.upper()
        if val not in ["ERROR", "INFO", "WARN", "WARNING", "CRITICAL", "DEBUG", "UNKNOWN"]:
            if not re.match(r'^\d+$', bracketed):  # Ignore numeric brackets (PID/timestamps)
                # Check if it looks like a date or time
                if re.search(r'\d{4}[-/]\d{2}[-/]\d{2}|\d{2}:\d{2}:\d{2}|\d{2}:\d{2}', bracketed):
                    continue
                return bracketed.lower()
                
    # 3. Look for a word followed by a colon before the message (e.g. auth-service: connection refused)
    # Split by colon and analyze the prefix part
    parts = line.split(':')
    if len(parts) > 1:
        left = parts[0].strip()
        # Clean any timestamp or bracketed parts from the left prefix
        left_clean = re.sub(r'\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}|\[.*?\]', '', left).strip()
        # If it is a clean single word identifier, it's likely the service name
        if left_clean and re.match(r'^[a-zA-Z][\w\-]*$', left_clean):
            if left_clean.upper() not in ["ERROR", "INFO", "WARN", "WARNING", "CRITICAL", "DEBUG"]:
                return left_clean.lower()
                
    # 4. Search for common service keywords in the text
    known_services = [
        "auth", "payment", "order", "inventory", "gateway", "api", "database", 
        "postgres", "redis", "cache", "email", "notification", "user", 
        "cart", "shipping", "catalog", "billing", "search", "recommendation"
    ]
    line_lower = line.lower()
    for service in known_services:
        match_word = re.search(rf'\b[\w\-]*{service}[\w\-]*\b', line_lower)
        if match_word:
            return match_word.group(0)
            
    return "application-service"

def parse_log_line(line: str) -> Optional[dict]:
    """
    Takes one line of a log file and extracts structured fields.
    Falls back to a smart heuristic parser if standard patterns fail.
    """
    line = line.strip()
    if not line:
        return None
        
    for pattern in LOG_PATTERNS:
        match = re.match(pattern, line)
        if match:
            groups = match.groups()
            if len(groups) == 5:
                return {
                    "timestamp": groups[0],
                    "log_level": standardize_log_level(groups[2], line),
                    "service_name": groups[3],
                    "message": groups[4],
                    "raw_line": line
                }
            elif len(groups) == 4:
                # Could be syslog with hostname & service, or standard pattern 1/2
                # Check if groups[1] is a known log level
                level_cand = groups[1].upper()
                if level_cand in ["ERROR", "WARN", "INFO", "DEBUG", "CRITICAL", "WARNING"]:
                    return {
                        "timestamp": groups[0],
                        "log_level": standardize_log_level(groups[1], line),
                        "service_name": groups[2],
                        "message": groups[3],
                        "raw_line": line
                    }
                else:
                    # groups[1] is hostname, groups[2] is service_name
                    # Fallback log level detection from message
                    return {
                        "timestamp": groups[0],
                        "log_level": standardize_log_level("UNKNOWN", line),
                        "service_name": groups[2],
                        "message": groups[3],
                        "raw_line": line
                    }
            
    # Simple extraction fallback
    log_level = "UNKNOWN"
    line_upper = line.upper()
    for level in ["ERROR", "WARN", "INFO", "DEBUG", "CRITICAL", "WARNING"]:
        if level in line_upper:
            log_level = "WARN" if level == "WARNING" else level
            break
            
    service = extract_service_name(line)
    
    # Clean the message by removing leading timestamps, level, and brackets
    message = line
    message = re.sub(r'^\[?\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\]?\s*', '', message)
    message = re.sub(rf'^\b{log_level}\b\s*', '', message, flags=re.IGNORECASE)
    message = re.sub(r'^\[.*?\]\s*', '', message)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "log_level": standardize_log_level(log_level, line),
        "service_name": service,
        "message": message.strip() or line,
        "raw_line": line
    }

def parse_log_file(content: str) -> list[dict]:
    """Parse an entire log file and return list of structured entries."""
    lines = content.split('\n')
    parsed = []
    for line in lines:
        result = parse_log_line(line)
        if result:
            parsed.append(result)
    return parsed
