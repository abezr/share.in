# Agent Event Bus — NATS JetStream

Streams

- agent.logs.\* — structured logs per runId/step
- agent.checkpoints.\* — durable checkpoints per runId/step

Consumers

- Durable per service for replay and rotation

KV

- Last good checkpoint pointer per runId

Recovery

- On failure/quota, spawn a new agent and fetch last checkpoint from KV, then replay.
