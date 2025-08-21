# 07_AUTOMATED_QUALITY_MONITORING

## Objective
Observability (OpenTelemetry), logs, and alerting for automated feedback.

## Outputs
- OTel SDK + Collector configs; alert routes to agent console webhooks.

## Steps
- Add OTel SDK to services and emit traces/metrics/logs.
- Deploy OTel Collector; export to your backend.
- Add Prometheus/Alertmanager rules.

## Acceptance Criteria
- Synthetic error triggers alert; agent receives structured feedback.

## References
- OTel Collector: https://opentelemetry.io/docs/collector/
