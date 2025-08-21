# 09_MCP_REGISTRY_AND_SGR_FOUNDATION

## Objective
Implement MCP registry (discover/connect/teardown) and SGR skeleton (schemas, validators).

## Outputs
- `agents/mcp-registry/` and `agents/sgr/` packages + tests.

## Steps
- Capability inference -> registry lookup -> connect minimal set of servers.
- SGR: define JSON Schemas for task/plan/validation and a validator.
- Add AWS↔GCP container schema example.

## Acceptance Criteria
- Given a conversion task, registry connects only required MCP servers; SGR returns a minimal structured plan.

## References
- MCP docs (search: Model Context Protocol)
