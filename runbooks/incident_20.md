# Incident Runbook

## Executive Summary
Incident: Anomaly spike in redis
Severity: Critical
System encountered an anomaly in redis causing issues across downstream services.

## Incident Details
* **ID**: 20
* **Time**: 2026-06-19 08:33:13.909630
* **Summary**: Redis experienced repeated cache pool warnings. Downstream impact propagated to cache-service, inventory-service, inventory, application-service, cart-service, cart and api-gateway. The total error rate was 85.7%, which exceeded the critical threshold.

## Root Cause Analysis
* **Service**: redis
* **Reason**: Out of Memory (OOM) Crash
* **Cascade**: api-gateway, cache-service, cart-service, cart, inventory, inventory-service, application-service

## Evidence Collected
* System logs indicated an increase in error rates.
* Anomaly metrics detected for redis.

## AI Hypotheses
* **Database connection pool exhausted** (Confidence: 15%)
  * The authentication service ran out of available connections in its connection pool due to a sudden traffic spike or unreleased connections.
* **Database host unreachable** (Confidence: 15%)
  * A networking timeout or host outage occurred between the application network and database server host.
* **Authentication service dependency failure** (Confidence: 15%)
  * Downstream services failed to authenticate requests because the auth-service endpoints returned connection errors.
* **Upstream service cascade failure** (Confidence: 65%)
  * The API gateway suffered cascading timeouts and returned 503 errors because backend payment and auth components stopped responding.

## Historical Similar Incidents
* **Incident 19** (Similarity: 0.93)
  * Root Cause: cache-service
  * Summary: Cache-service experienced repeated database connection failures. Downstream impact propagated to session-service and api-gateway. The total error rate was 77.8%, which exceeded the critical threshold.
* **Incident 17** (Similarity: 0.67)
  * Root Cause: auth-service
  * Summary: Auth-service experienced repeated database connection failures. Downstream impact propagated to payment-service and api-gateway. The total error rate was 80.0%, which exceeded the critical threshold.
* **Incident 18** (Similarity: 0.67)
  * Root Cause: inventory-service
  * Summary: Inventory-service experienced repeated database connection failures. Downstream impact propagated to order-service and api-gateway. The total error rate was 80.0%, which exceeded the critical threshold.

## Immediate Remediation Steps
1. Identify the failing container for redis.
2. Restart the redis service.
3. Check upstream dependencies and downstream clients for recovery.

## Long-Term Prevention Measures
1. Improve health checks for redis.
2. Set up auto-scaling rules based on error rates and resource usage.
3. Review timeouts for downstream services: api-gateway, cache-service, cart-service, cart, inventory, inventory-service, application-service.

## Verification Checklist
* Verify database connectivity
* Verify redis health endpoint
* Verify connection pool utilization
* Verify downstream services (api-gateway, cache-service, cart-service, cart, inventory, inventory-service, application-service) recovery
* Verify API gateway error rate is nominal

## Lessons Learned
* Enhance monitoring and alerting thresholds for redis.
* Structured logging should be strictly enforced.
