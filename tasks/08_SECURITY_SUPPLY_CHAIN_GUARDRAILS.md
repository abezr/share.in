# 08_SECURITY_SUPPLY_CHAIN_GUARDRAILS

## Objective
Automate SAST/SCA, image/IaC scanning, and policy-as-code gates.

## Outputs
- Semgrep rules; Trivy scans; OPA/Gatekeeper policies; CI jobs.

## Steps
- Semgrep in CI (SAST + secrets).
- Trivy for containers/IaC/SBOM.
- OPA/Rego policies & Gatekeeper for cluster enforcement.

## Acceptance Criteria
- CI fails on critical findings; Gatekeeper blocks policy violations.

## References
- Semgrep: https://semgrep.dev/docs/
- Trivy: https://aquasecurity.github.io/trivy/latest/
- OPA: https://www.openpolicyagent.org/docs/
