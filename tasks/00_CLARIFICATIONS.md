# 00_CLARIFICATIONS

## Objective
Capture open questions to fine-tune scope without blocking execution.

## Questions
1. Target languages/stacks for Helios core services (Go/Node/Rust)?
2. Preferred IaC (Terraform/Pulumi) + providers to prioritize (Cloudflare, Vercel, Fly.io, Supabase, Railway, Netlify, GCP/AWS/Azure)?
3. Initial agent specializations to ship first (infra conversion, validator, optimizer, security)?
4. SLO targets for API latency, job throughput, and observability backends?
5. Persistence choices (PostgreSQL version, object store vendor) and retention policy for logs/checkpoints?
6. Minimal browser support for the Console/Extension (Chrome stable vs Chromium family)?
7. Any prohibited vendors/regions/legal restrictions for the community pool?
8. Which DB migration tool do we standardize on (Flyway vs Liquibase)?
9. Hosting for the NATS cluster (self-host vs managed) and acceptable durability (RPO/RTO)?
10. Minimum bar for ad/vendor integrations and user privacy constraints?

## Acceptance Criteria
- Questions acknowledged in project tracking with owner + due date.
