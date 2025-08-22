# Open Questions — Tracking

| #   | Question                                  | Decision/Preference                                                                        | Owner         | Due Date   |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------ | ------------- | ---------- |
| 1   | Target languages/stacks for core services | Node.js for control-plane; Rust for high-throughput agents/components                      | Eng Lead      | 2025-09-15 |
| 2   | IaC + providers priority                  | Terraform; prioritize GCP and Cloudflare; support Vercel for frontend                      | Platform Lead | 2025-09-15 |
| 3   | Initial agent specializations             | Infra conversion, validator, optimizer, security                                           | Product       | 2025-09-10 |
| 4   | SLO targets                               | API p95 < 250ms; job throughput 100/min baseline; OTel backend 99.9% avail                 | SRE           | 2025-09-10 |
| 5   | Persistence choices & retention           | Postgres 15; object store GCS; logs/checkpoints 7 days default; override via user settings | Platform      | 2025-09-10 |
| 6   | Browser support                           | Chrome stable (latest 2 versions)                                                          | Frontend      | 2025-09-01 |
| 7   | Prohibited vendors/regions/legal          | No sanctioned regions; follow OFAC/EU export controls; avoid CN mainland regions           | Legal         | 2025-09-20 |
| 8   | DB migration tool                         | Flyway                                                                                     | Platform      | 2025-09-05 |
| 9   | NATS cluster hosting & RPO/RTO            | Managed where available; else self-host; RPO<=1s, RTO<=5m                                  | SRE           | 2025-09-20 |
| 10  | Vendor offers privacy constraints         | Explicit opt-in; contextual only; no sale of personal data; per-tenant opt-out             | Product/Legal | 2025-09-20 |
