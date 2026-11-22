/**
 * Senior Domain Knowledge Bases: Infrastructure, Data, QA, Security & General Engineering
 * Roles: devops, qa, data, security, general
 */

export const KB_ENGINEERING_INFRA = {
  devops: {
    mandate: 'Design self-healing cloud platforms and CI/CD guardrails where SLO error budgets drive engineering velocity, blast radius is strictly isolated, and incidents turn into automated resilience.',
    mentalModels: [
      'SLOs & Multi-Window Burn-Rate Alerts: Alert on Error Budget consumption rate (customer-visible availability/latency impact), NOT noisy raw CPU spikes.',
      'Kubernetes Probe Hygiene: Readiness controls traffic routing; Liveness triggers container restarts—NEVER wire `/healthz/live` to check Postgres/Redis or downstream hiccups will kill your entire fleet!',
      'Zero-Downtime Migrations (Expand-Contract): Add nullable columns -> dual-write/backfill -> switch reads -> drop legacy columns; decouple deploys from risky releases with feature flags.',
      'Infrastructure Blast-Radius Isolation: Split Terraform state by environment + failure domain, enforce IAM least privilege + OIDC keyless CI auth, and test backup restores automatically.'
    ],
    probeLadders: [
      { claim: 'Our readiness and liveness probes both hit /health checking the DB', probe: 'Walk through the cascading failure storm when Postgres blips 3 seconds and Kubernetes simultaneously restarts every healthy API pod.' },
      { claim: 'We manage everything in one Terraform repo and state file', probe: 'Challenge lock contention, slow `plan` blasts, and blast radius when a dev module change threatens shared VPC/prod databases.' },
      { claim: 'We cut cloud costs by downsizing nodes', probe: 'Push on architectural FinOps: Spot/Graviton workload fitness, EBS/egress architecture, observability log cardinality pruning, and Karpenter/HPA tuning.' }
    ],
    redFlags: [
      'Manual SSH hotfixes ("ClickOps") in production diverging silently from Infrastructure-as-Code.',
      'Treating observability as hoarding 10TB of noisy debug logs without structured trace correlation (`trace_id`) or actionable SLOs.',
      'Assuming backups work without ever testing automated point-in-time recovery (RPO/RTO drills).'
    ],
    roundRubrics: {
      HR: 'Confirm cloud depth (AWS/GCP/Azure), Kubernetes vs managed serverless judgment, GitOps/IaC discipline, and on-call incident ownership.',
      Behavioral: 'Probe leading a Sev-1 outage call cleanly, conducting a truly blameless postmortem that changed team habits, and reducing developer CI wait times.',
      Technical: 'Drill Linux networking/DNS/TLS debugging, K8s scheduling/PDBs/probes, Expand-Contract DB migrations, Terraform state isolation, and FinOps egress/log savings.',
      'Live Coding': 'Live Incident Triage: 502 spike after deploy or K8s CrashLoopBackOff cascade—walk through systematic hypothesis isolation from edge LB down to kernel/DB.',
      'System Design': 'Architect multi-AZ / multi-region SaaS infrastructure with isolated blast radii, GitOps progressive canary rollouts, secrets lifecycle, and <5m RTO.',
      Negotiation: 'Calibrate Staff SRE / Platform Lead band, on-call stipend/compensation, tooling budget, and remote terms.'
    },
    powerPhrases: [
      'Never let a liveness probe depend on an external database—otherwise a transient DB hiccup turns into a full-fleet Kubernetes restart storm.',
      'Observability isn’t collecting every log line; it’s multi-window SLO burn alerts paired with low-cardinality metrics and exemplar trace IDs for fast MTTR.'
    ]
  },

  qa: {
    mandate: 'Elevate release velocity AND confidence simultaneously by architecting deterministic, risk-prioritized test automation (Contract -> Component -> Minimal Critical-Path E2E) embedded directly into CI/CD.',
    mentalModels: [
      'Testing Trophy / Risk Pyramid: Fast unit & consumer-driven Contract tests (Pact/OpenAPI) catch 80% of integration breakage in seconds; reserve heavyweight E2E only for critical revenue/auth journeys.',
      'Zero-Flake Determinism: Eliminate `sleep(3000)` hacks; await explicit network/DOM settlement signals, isolate per-worker test data via API factories, and mock flaky external payment sandboxes deterministically.',
      'Flaky Test Quarantine Policy: Never normalize hitting "Re-run failed jobs"—auto-quarantine flakes, file root-cause bugs (hydration race, clock skew, shared state), and keep PR CI under 10 minutes.',
      'Shift-Left Quality Advocacy: Join design/PRD kickoffs to expose untestable specs, missing error telemetry, and ambiguous boundary conditions before a line of code ships.'
    ],
    probeLadders: [
      { claim: 'Our goal is 100% E2E Playwright coverage of every screen', probe: 'Challenge CI feedback latency, brittle locator maintenance tax, and exponential flake rate (`0.99^200 = 13%` passing suite!) vs contract + API layering.' },
      { claim: 'Playwright clicks occasionally miss buttons, so we added waitForTimeout(1000)', probe: 'Uncover underlying hydration/animation stability issue and demonstrate web-first auto-retrying assertions + network intercepts.' },
      { claim: 'Manual QA checks every PR before merge', probe: 'Expose human bottleneck blocking continuous delivery vs feature-flagged canary safety + fast exploratory risk charters.' }
    ],
    redFlags: [
      'Measuring QA success by raw bug counts or script volume rather than escaped production defects and safe deploy frequency.',
      'Running stateful sequential E2E suites where Test #4 fails whenever Test #3 crashes.',
      'Zero familiarity with CI parallel sharding, network HAR mocking, or backend SQL/API state inspection.'
    ],
    roundRubrics: {
      HR: 'Distinguish manual QA vs full-stack SDET automation (Playwright/Cypress/API contract/CI performance), coding depth, and shift-left leadership.',
      Behavioral: 'Probe pushing back on shipping an under-tested high-risk billing change, eliminating chronic suite flakiness, and converting Dev teams to own unit/contract tests.',
      Technical: 'Drill Playwright isolation (`browserContext`/storageState), Contract testing (OpenAPI/Pact), flaky timing race diagnosis, test data seeding, and k6 load profiling.',
      'Live Coding': 'Diagnose & refactor a slow, flaky E2E checkout test into isolated API-seeded setup + deterministic network/UI assertions.',
      'System Design': 'Architect Quality & Release Engineering Strategy for 10 microservices + SPA monorepo (<8 min PR gate, ephemeral preview envs, canary synthetic monitors).',
      Negotiation: 'Calibrate Staff/Senior SDET parity with SWE compensation bands, quality tooling ownership, and scope.'
    },
    powerPhrases: [
      'If a 200-test E2E suite has even 1% per-test flake, a completely healthy PR only passes 13% of runs—determinism and layered contract tests beat blind E2E volume.',
      'Wait-timers hide race conditions; deterministic tests seed isolated state via API and wait on observable network or UI readiness invariants.'
    ]
  },

  data: {
    mandate: 'Build trustworthy, cost-efficient data & ML platforms where idempotent incremental pipelines, strict schema/data contracts, and leak-free evaluation drive reliable executive and model decisions.',
    mentalModels: [
      'Idempotent Incremental Backfills: Use partition-scoped `MERGE` / atomic `INSERT OVERWRITE` with event-time watermarks & lookback windows for late-arriving mobile/webhook events—never fragile append-only jobs.',
      'Dimensional & Grain Rigor: Declare table grain explicitly (`1 row per invoice_line_item`), avoid fan-out multi-fact join inflation, use SCD Type 2 carefully for historical attribution snapshots.',
      'Data Contracts & Quality Gates: Enforce schema + freshness + null/uniqueness + distribution checks (`dbt test` / Great Expectations / Soda) IN the pipeline before corrupting executive dashboards.',
      'ML Production Reality: Prevent temporal/target label leakage, detect Train-Serving Skew via shared Feature definitions, and monitor online covariate drift & calibration decay—not just offline AUC.'
    ],
    probeLadders: [
      { claim: 'Our daily dbt job runs full refresh every night', probe: 'Challenge 50x data growth cost, warehouse lock contention, and silent corruption when events arrive 48 hours late.' },
      { claim: 'Our churn model hits 0.93 AUC offline', probe: 'Interrogate temporal split leakage (did future refund/ticket columns leak into training features?), class imbalance precision@k, and online shadow A/B revenue lift.' },
      { claim: 'Finance and Sales numbers don’t match in BI', probe: 'Trace divergent metric definitions across BI workbooks vs centralized semantic metric layer + certified gold tables.' }
    ],
    redFlags: [
      'Dumping unvalidated raw JSON events directly into board-level dashboards without contract tests.',
      'Evaluating ML models on random row splits of time-series user behavior (classic leakage!).',
      'Ignoring BigQuery/Snowflake scan partitioning/clustering costs on petabyte queries.'
    ],
    roundRubrics: {
      HR: 'Clarify Data Eng (Spark/dbt/Snowflake/Airflow) vs Analytics Eng vs Applied ML focus, scale of data/latency SLAs, and business stakeholder fluency.',
      Behavioral: 'Probe recovering silently corrupted revenue tables before Board meeting, killing an overengineered ML model where simple heuristics won, and unifying conflicting KPIs.',
      Technical: 'Drill window functions, SCD Type 2 vs snapshots, late-arriving watermark idempotency, partition pruning/clustering, and Train-Serving Skew / leakage prevention.',
      'Live Coding': 'Design idempotent incremental MERGE query handling late-arriving updates & deduplication OR catch subtle time-travel data leakage in ML pipeline.',
      'System Design': 'Architect end-to-end Lakehouse + Streaming Event Ingestion + Semantic Metrics + Feature Store serving both BI and low-latency fraud/churn inference.',
      Negotiation: 'Calibrate Staff/Senior Data/ML band, compute/tooling autonomy, and equity package.'
    },
    powerPhrases: [
      'Every table needs an explicit grain and an idempotent backfill key—re-running yesterday’s partition twice must yield identical totals even when late events arrive.',
      'Offline 0.94 AUC means nothing if future signals leaked into training rows or the feature isn’t reproducible at real-time serving latency.'
    ]
  },

  security: {
    mandate: 'Reduce real organizational breach probability—eliminating systemic vulnerability classes across trust boundaries, identity, and CI/CD supply chains while enabling high-velocity engineering.',
    mentalModels: [
      'Trust Boundaries & Blast Radius Threat Modeling (STRIDE): Map unauthenticated ingress, tenant isolation edges, internal service-to-service trust, and secret stores before patching symptoms.',
      'Modern AuthN/AuthZ Invariants: Eliminate BOLA/IDOR by enforcing object-level ownership predicates inside domain data queries; use OAuth2 + PKCE, short-lived tokens, strict JWT `alg`/issuer validation.',
      'SSRF, Supply Chain & CI Security: Block metadata IP egress (`169.254.169.254`), pin container/GitHub Action SHA digests, replace static long-lived cloud keys with OIDC workload identity, maintain SBOMs.',
      'Pragmatic Vulnerability Prioritization: Triage via CVSS + EPSS (exploit likelihood) + runtime reachability—never block releases over unreachable dev-dependency noise.'
    ],
    probeLadders: [
      { claim: 'Our API uses JWTs over HTTPS so endpoints are secure', probe: 'Attack immediately with BOLA/IDOR (`GET /api/invoices/999` owned by Tenant B), CSRF on cookie auth, or weak JWT `kid`/algorithm confusion.' },
      { claim: 'We run Trivy/Snyk and block builds on all Critical/High CVEs', probe: 'Challenge developer bypass culture when unpatched OS base libs aren’t reachable—walk through reachability/VEX + compensating WAF/sandbox controls.' },
      { claim: 'Users can upload webhook URLs or PDF URLs', probe: 'Probe Server-Side Request Forgery (SSRF) against internal cloud metadata endpoints, DNS rebinding, and headless browser/parser sandboxing.' }
    ],
    redFlags: [
      'Practicing "Security Says No" checkbox compliance without offering fast secure paved roads (safe SDKs, pre-approved Terraform modules).',
      'Storing plaintext API secrets in `.env` files/CI variables with overly broad Admin IAM roles.',
      'Confusing encryption-at-rest (disk theft protection) with application-layer authorization & field-level tenant isolation.'
    ],
    roundRubrics: {
      HR: 'Validate AppSec / Product Security vs CloudSec / GRC-CISO breadth, incident response exposure, and partnering smoothly with Engineering.',
      Behavioral: 'Probe de-escalating a live zero-day/CVE panic with pragmatic triage, catching a critical BOLA/secret leak in review, and building secure paved roads.',
      Technical: 'Drill OAuth2/OIDC/PKCE pitfalls, BOLA/IDOR enforcement, SSRF & DNS rebinding defenses, KMS envelope encryption, OIDC CI secrets, and Zero Trust.',
      'Live Coding': 'Threat-model & patch an exposed multi-tenant webhook/export/auth endpoint identifying BOLA, SSRF, and privilege escalation paths.',
      'System Design': 'Architect Zero-Trust Multi-Tenant SaaS Security & DevSecOps Paved Road (Workload Identity, Tenant Row Security, Key Rotation, Automated Audit Trail).',
      Negotiation: 'Calibrate Principal Security / Head of Security / CISO reporting line (CTO vs independent), incident/bug-bounty budget authority, and compensation.'
    },
    powerPhrases: [
      'Security scales through paved roads, not Jira gates—giving squads default-safe auth middleware and OIDC keyless CI eliminates entire bug classes at source.',
      'Never rely on perimeter auth alone; every internal tenant query needs enforced object-level ownership invariants to kill BOLA permanently.'
    ]
  },

  general: {
    mandate: 'Decompose ambiguous technical & business problems into simple, maintainable systems with resilient failure handling, clean data models, and pragmatic engineering ROI.',
    mentalModels: [
      'Simplicity & Reversibility: Choose proven boring technology matching team size; optimize critical paths via real measurement rather than speculative abstraction.',
      'Failure-Mode & Tail Latency Engineering: Every external call needs explicit timeouts, bounded retries with exponential backoff + jitter, circuit breakers, and idempotency keys on state-mutating operations.',
      'Storage & Indexing Mechanics: Design access patterns first (composite index selectivity, avoiding lock contention, cursor vs offset pagination, cache-aside stampede locks).',
      'Clean Observability: Structured logs with correlation IDs, RED metrics (Rate, Errors, Duration p95/p99), and actionable alerts tied to user pain.'
    ],
    probeLadders: [
      { claim: 'We will add Redis caching to speed everything up', probe: 'Push on cache invalidation race conditions, thundering-herd stampedes on hot-key expiry, stale reads on permissions/prices, and cold-cache DB survival.' },
      { claim: 'Our API retries failed downstream requests 5 times', probe: 'Expose retry storms amplifying downstream outages without exponential jitter, circuit breaking, and strict idempotency keys.' },
      { claim: 'Offset pagination (`OFFSET 50000`) works fine in SQL', probe: 'Explain O(N) scanned-and-discarded rows + shifting row duplicates under concurrent inserts vs deterministic keyset/cursor pagination.' }
    ],
    redFlags: [
      'Designing distributed microservices, Kafka, and GraphQL without quantifying latency, team overhead, or data consistency pain.',
      'Assuming networks are reliable, clocks are synchronized, and third-party webhooks arrive exactly once in order.',
      'Writing silent catch blocks or generic 500 errors hiding root operational failures.'
    ],
    roundRubrics: {
      HR: 'Validate generalist full-stack breadth, domain ownership from PRD to prod telemetry, and clear communication with non-technical peers.',
      Behavioral: 'Probe untangling messy legacy bottlenecks pragmatically, owning production mistakes transparently, and balancing tech quality with shipping deadlines.',
      Technical: 'Drill SQL indexing/locking, idempotency + retries/jitter, cache stampede defenses, API pagination/versioning, and structured debugging.',
      'Live Coding': 'Trace an end-to-end race condition, rate-limiter, or webhook deduplication bug verbally with explicit edge cases and complexity awareness.',
      'System Design': 'Architect a clean, resilient multi-tenant web + async worker platform scaling cleanly from 10k to 1M daily requests without premature complexity.',
      Negotiation: 'Calibrate Senior / Staff generalist leveling, remote flexibility, equity, and base compensation.'
    },
    powerPhrases: [
      'Every retry policy without exponential jitter and a circuit breaker is a self-inflicted DDoS waiting to happen during partial downstream outages.',
      'I optimize systems around real measured p99 bottlenecks and reversibility—keeping boundaries clean in-process until scale or team structure truly earns network hops.'
    ]
  }
};
