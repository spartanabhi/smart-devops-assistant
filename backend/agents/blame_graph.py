import networkx as nx
import logging
from services.root_cause_engine import extract_error_reason

logger = logging.getLogger("smart-devops-assistant.blame-graph")

def build_blame_graph(
    incident,
    root_cause_service: str,
    cascade: list,
    hypotheses: list,
    historical_matches: list,
    log_entries: list
) -> dict:
    """
    Builds a directed graph showing service failures, SRE hypotheses,
    and historical matches linked to the root cause service.
    """
    G = nx.DiGraph()
    
    # 1. Identify all affected services and their error counts
    affected_services = set()
    error_counts = {}
    
    for entry in log_entries:
        if isinstance(entry, dict):
            log_level = entry.get("log_level")
            service_name = entry.get("service_name")
        else:
            log_level = getattr(entry, "log_level", "")
            service_name = getattr(entry, "service_name", "")
            
        if log_level in ["ERROR", "CRITICAL"]:
            affected_services.add(service_name)
            error_counts[service_name] = error_counts.get(service_name, 0) + 1

    # Ensure root cause and cascade services are in affected_services
    if root_cause_service:
        affected_services.add(root_cause_service)
    for s in cascade:
        affected_services.add(s)

    # 2. Add Service Nodes (root_cause and cascade)
    inc_severity = getattr(incident, "severity", "Critical").lower() if incident else "critical"
    
    for service in affected_services:
        is_root = (service == root_cause_service)
        node_type = "root_cause" if is_root else "cascade"
        severity = inc_severity if is_root else "high"
        
        G.add_node(
            service,
            label=service,
            type=node_type,
            severity=severity,
            error_count=error_counts.get(service, 0)
        )

    # 3. Add Edges between Service Nodes representing cascade sequence
    # Chain of failures: root_cause_service -> cascade[0] -> cascade[1] -> ...
    if root_cause_service:
        clean_cascade = [s for s in cascade if s != root_cause_service]
        chain = [root_cause_service] + clean_cascade
        for i in range(len(chain) - 1):
            src = chain[i]
            tgt = chain[i+1]
            
            # Find a reason from target service's error logs
            reason = None
            for entry in log_entries:
                if isinstance(entry, dict):
                    s_name = entry.get("service_name")
                    msg = entry.get("message", "")
                else:
                    s_name = getattr(entry, "service_name", "")
                    msg = getattr(entry, "message", "")
                
                if s_name == tgt:
                    msg_lower = msg.lower()
                    if "timeout waiting for auth" in msg_lower:
                        reason = "timeout waiting for auth response"
                        break
                    elif "auth service down" in msg_lower:
                        reason = "auth service down"
                        break
                    elif "connection refused" in msg_lower or "unreachable" in msg_lower:
                        reason = "connection refused"
                        break
                    elif "500 internal server error" in msg_lower:
                        reason = "500 Internal Server Error"
                        break
                    elif "503 service unavailable" in msg_lower:
                        reason = "503 Service Unavailable"
                        break
            
            if not reason:
                # Dynamic fallback reason from the first error message of the target service
                for entry in log_entries:
                    if isinstance(entry, dict):
                        s_name = entry.get("service_name")
                        msg = entry.get("message", "")
                        lvl = entry.get("log_level", "")
                    else:
                        s_name = getattr(entry, "service_name", "")
                        msg = getattr(entry, "message", "")
                        lvl = getattr(entry, "log_level", "")
                    if s_name == tgt and lvl in ["ERROR", "CRITICAL"]:
                        reason = extract_error_reason(msg)
                        break
            
            reason = reason or "cascading failure"
            weight = error_counts.get(tgt, 1)
            G.add_edge(src, tgt, weight=weight, reason=reason)

    # 4. Add Hypothesis Nodes and connect them to root_cause_service
    # Connect hypothesis -> root_cause_service
    for hyp in hypotheses:
        hyp_title = hyp.get("title", "")
        if not hyp_title:
            continue
            
        hyp_id = f"hyp_{hyp.get('id', 0)}"
        confidence = hyp.get("confidence", 0)
        if confidence >= 80:
            severity = "high"
        elif confidence >= 50:
            severity = "medium"
        else:
            severity = "low"
            
        G.add_node(
            hyp_id,
            label=hyp_title,
            type="hypothesis",
            severity=severity,
            error_count=0
        )
        
        if root_cause_service:
            reason_str = f"Evidence count: {len(hyp.get('evidence', []))}"
            G.add_edge(hyp_id, root_cause_service, weight=1, reason=reason_str)

    # 5. Add Historical Match Nodes and connect them to root_cause_service
    # Connect historical_match -> root_cause_service
    for hist in historical_matches:
        incident_id = hist.get("incident_id")
        if not incident_id:
            continue
            
        hist_id = f"hist_{incident_id}"
        label = f"Incident #{incident_id} (Score: {hist.get('similarity_score', 0.0)})"
        
        score = hist.get("similarity_score", 0.0)
        if score >= 0.8:
            severity = "critical"
        elif score >= 0.5:
            severity = "high"
        else:
            severity = "medium"
            
        G.add_node(
            hist_id,
            label=label,
            type="historical_match",
            severity=severity,
            error_count=0
        )
        
        if root_cause_service:
            reason_str = f"Similarity score: {score}"
            G.add_edge(hist_id, root_cause_service, weight=1, reason=reason_str)

    # 6. Convert to D3-compatible format
    nodes = []
    for node_name in G.nodes():
        node_attr = G.nodes[node_name]
        nodes.append({
            "id": node_name,
            "label": node_attr.get("label", node_name),
            "type": node_attr.get("type", "cascade"),
            "severity": node_attr.get("severity", "medium"),
            "error_count": node_attr.get("error_count", 0)
        })
        
    edges = []
    for u, v in G.edges():
        edge_attr = G.edges[u, v]
        edges.append({
            "source": u,
            "target": v,
            "weight": edge_attr.get("weight", 0),
            "reason": edge_attr.get("reason", "cascades to")
        })

    return {"nodes": nodes, "edges": edges}
