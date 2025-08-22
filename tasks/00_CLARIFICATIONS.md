# 00_CLARIFICATIONS

## Objective

Capture open questions to fine-tune scope without blocking execution.

## Questions

1. Target languages/stacks for core services: Node/Rust (for crytically highloaded parts)
2. Preferred IaC (Terraform or Pulumi(with Python)) + providers to prioritize (GCP/AWS/Azure, Cloudflare, Vercel, Fly.io, Supabase, Railway, Netlify)
3. Initial agent specializations to ship first (infra conversion, validator, optimizer, security)
4. SLO targets for API latency, job throughput, and observability backends - pls define yourself
5. Persistence choices (PostgreSQL version, object store vendor) and retention policy for logs/checkpoints - shorttherm if not customized in user-settings storage
6. Minimal browser support for the Console/Extension (Chrome stable)
7. Any prohibited vendors/regions/legal restrictions for the community pool - find it out and fill
8. Which DB migration tool do we standardize on (Flyway vs Liquibase) - preferrable for you
9. Hosting for the NATS cluster (self-host vs managed) and acceptable durability (RPO/RTO) - choose yourself
10. Minimum bar for ad/vendor integrations and user privacy constraints - define yourself

## Acceptance Criteria

- Questions acknowledged in project tracking with owner + due date.
