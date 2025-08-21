# 10_AGENT_CHECKPOINTING_AND_EVENT_BUS

## Objective
Durable checkpoints, logs, and pub/sub for rotation using NATS JetStream.

## Outputs
- Streams: `agent.logs`, `agent.checkpoints`; KV for last-good checkpoints.

## Steps
- Provision NATS JetStream; define streams + durable consumers.
- Integrate client libs (Go/JS) and test replay.

## Acceptance Criteria
- Kill an agent mid-plan; new agent resumes from last checkpoint.

## References
- JetStream: https://docs.nats.io/nats-concepts/jetstream
