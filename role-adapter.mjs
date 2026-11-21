// Universal multi-role CV adapter: adapts interviewers, fake job postings,
// Daily Path drills, and live call directives to ANY uploaded software CV
// (QA/SDET, Java, .NET/C#, PHP, Flutter, Python, DevOps, Frontend, etc.).

const ROLE_ARCHETYPES = {
  qa: {
    label: 'QA / SDET & Test Automation',
    keywords: ['qa', 'sdet', 'quality assurance', 'test automation', 'playwright', 'cypress', 'selenium', 'restassured', 'appium', 'testng', 'junit', 'pytest', 'k6', 'jmeter', 'postman', 'bug triage', 'regression'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal QA Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Remote Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Engineering — Quality Culture', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'QA Lead — Cross-Team Influence', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Director — Release Risk & ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Test Pyramid, CI Gates & Flake Control', badgeText: 'CI/CD' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Playwright, Cypress & Selector Strategy', badgeText: 'E2E' },
      '03c-tech-nodejs-payments-testing.md': { title: 'API Contract, RestAssured & Load Testing', badgeText: 'API' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Defect Triage, RCA & Release Sign-Off', badgeText: 'RCA' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Async Waits & Flaky Tests', badgeText: 'Wait' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Test Data & Edge Matrices', badgeText: 'Data' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — DOM/Mobile Page Objects', badgeText: 'POM' },
      '05-system-design-fintech-saas.md': { title: 'QA Platform & Parallel CI Architecture', badgeText: 'QA Sys' },
      '06-salary-contract-negotiation.md': { title: 'Internal Promotion & Band Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Remote Rate & Scope Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'NordicPay Systems',
        roleTitle: 'Senior QA Automation / SDET Engineer',
        domain: 'High-volume payments & checkout reliability across Web + APIs',
        responsibilities: [
          'Architect parallel E2E & API regression suites integrated into pull-request CI gates',
          'Eliminate flaky tests, establish synthetic test-data factories, and enforce SLAs before release',
          'Partner with product engineers on Shift-Left testability, contract tests, and k6 load benchmarks'
        ]
      },
      {
        company: 'ClearGrid SaaS',
        roleTitle: 'Staff Quality Engineer — Release Velocity',
        domain: 'Multi-tenant B2B cloud platform with zero-downtime daily deployments',
        responsibilities: [
          'Own release quality metrics, defect escape rate dashboards, and root-cause triage rituals',
          'Mentor product developers on integration testing patterns and mocking strategies',
          'Automate smoke, regression, and accessibility verification in GitHub Actions'
        ]
      },
      {
        company: 'Veloce Cloud EU',
        roleTitle: 'Lead QA Engineer (Remote Contract)',
        domain: 'Regulated EU enterprise SaaS needing auditable QA governance & automation',
        responsibilities: [
          'Lead test strategy across web, REST/GraphQL services, and third-party webhook flows',
          'Define risk-based testing checklists for hotfixes, migrations, and peak traffic events'
        ]
      }
    ]
  },
  java: {
    label: 'Java / JVM Backend',
    keywords: ['java', 'spring boot', 'spring', 'hibernate', 'jpa', 'maven', 'gradle', 'jvm', 'kafka', 'mockito', 'junit', 'microservices', 'kotlin', 'quarkus'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Backend Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Java/Cloud Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Engineering — Backend Ownership', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Engineering Manager — STAR Incidents', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Director — Reliability & SLA ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'JVM Memory, GC & High Throughput', badgeText: 'JVM' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Spring Boot, DI, Transactions & JPA', badgeText: 'Spring' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Kafka, Idempotency & JUnit/Testcontainers', badgeText: 'Kafka' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Deadlock Triage, N+1 & PR Review', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Concurrency & CompletableFuture', badgeText: 'Async' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Streams, Maps & Aggregation', badgeText: 'Stream' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Rate Limiter & Cache Design', badgeText: 'Cache' },
      '05-system-design-fintech-saas.md': { title: 'Distributed Ledger & Event-Driven Systems', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Senior/Staff Promotion Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU B2B Rate & Contract Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'EuroLedger Financial',
        roleTitle: 'Senior Java / Spring Boot Backend Engineer',
        domain: 'High-throughput settlement APIs, Kafka event pipelines, and PostgreSQL ledgers',
        responsibilities: [
          'Design resilient microservices in Java 21 + Spring Boot with strict transactional integrity',
          'Eliminate JPA N+1 bottlenecks, tune JVM heap/GC telemetry, and build Testcontainers suites',
          'Ensure idempotent event consumers across payment and reconciliation workflows'
        ]
      },
      {
        company: 'FreightPulse Logistics',
        roleTitle: 'Staff JVM Platform Engineer',
        domain: 'Real-time EU shipment tracking & distributed scheduling at scale',
        responsibilities: [
          'Architect high-concurrency routing and pricing engines using Kafka, Redis, and PostgreSQL',
          'Lead PR reviews, define API backward-compatibility standards, and mentor mid-level devs'
        ]
      },
      {
        company: 'KronoHealth Tech',
        roleTitle: 'Senior Java / Cloud Engineer (EU Remote)',
        domain: 'Healthcare interoperability APIs & audit-compliant cloud workflows',
        responsibilities: [
          'Own service observability, zero-downtime schema migrations, and OAuth2/JWT security layers'
        ]
      }
    ]
  },
  dotnet: {
    label: '.NET / C# Engineering',
    keywords: ['c#', '.net', 'dotnet', 'asp.net', 'entity framework', 'ef core', 'linq', 'blazor', 'azure', 'sql server', 'mediatr', 'xunit', 'nunit', 'wpf'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal .NET Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'UK/EU .NET Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Engineering Director — Chemistry Call', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Engineering Manager — STAR Ownership', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Lead — Modernization & ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: '.NET 8 Runtime, Async/Task & Perf', badgeText: '.NET8' },
      '03b-tech-angular-nx-rxjs.md': { title: 'ASP.NET Core, Clean Arch & EF Core', badgeText: 'EF' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Azure Service Bus, SQL & xUnit Testing', badgeText: 'Azure' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Async Deadlock & LINQ PR Review', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — CancellationToken & Channels', badgeText: 'Async' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — LINQ Grouping & Memory', badgeText: 'LINQ' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Middleware & Caching', badgeText: 'API' },
      '05-system-design-fintech-saas.md': { title: 'Distributed .NET & Azure Cloud Design', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Band & Role Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Contract Rate Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'NorthStar Treasury',
        roleTitle: 'Senior .NET 8 / C# Backend Engineer',
        domain: 'Cloud-native B2B invoicing, Azure Service Bus orchestration, and SQL reporting',
        responsibilities: [
          'Build low-latency ASP.NET Core Web APIs using Clean Architecture, CQRS, and EF Core',
          'Optimize complex SQL Server queries, memory allocations (Span<T>), and background workers',
          'Enforce automated xUnit integration tests with Azure pipelines'
        ]
      },
      {
        company: 'GridScale Energy EU',
        roleTitle: 'Lead C# / Azure Full-Stack Developer',
        domain: 'Real-time smart-meter telemetry & customer billing portal',
        responsibilities: [
          'Modernize legacy .NET Framework modules to .NET 8 containers with zero downtime',
          'Coach engineers on async pitfalls, DI lifetimes, and distributed locking'
        ]
      },
      {
        company: 'FinBridge Solutions',
        roleTitle: 'Principal .NET Solutions Engineer',
        domain: 'Enterprise banking connectors & automated compliance auditing',
        responsibilities: [
          'Design resilient idempotent payment gateways and audit-logged event stores'
        ]
      }
    ]
  },
  php: {
    label: 'PHP / Laravel & Symfony',
    keywords: ['php', 'laravel', 'symfony', 'composer', 'eloquent', 'doctrine', 'phpunit', 'pest', 'wordpress', 'magento', 'lumen', 'october'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal PHP/SaaS Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Remote Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CTO / Founder Chemistry Call', badgeText: 'CTO' },
      '02-behavioral-leadership-star.md': { title: 'Engineering Manager — STAR Delivery', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Director — Checkout & ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'PHP 8.3, Octane, Redis & High Scale', badgeText: 'PHP8' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Laravel / Symfony Service Boundaries', badgeText: 'Laravel' },
      '03c-tech-nodejs-payments-testing.md': { title: 'MySQL Tuning, Horizon Queues & Pest', badgeText: 'SQL' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Legacy Refactor, Security & PR Review', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Queues, Locks & Retries', badgeText: 'Queue' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Collections & Aggregation', badgeText: 'Data' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Webhook Middleware', badgeText: 'API' },
      '05-system-design-fintech-saas.md': { title: 'Multi-Tenant SaaS & Queue Architecture', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Promotion Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU B2B Rate Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'CartFlow Commerce',
        roleTitle: 'Senior PHP 8 / Laravel Platform Engineer',
        domain: 'High-traffic EU e-commerce subscriptions, billing webhooks & merchant dashboards',
        responsibilities: [
          'Architect clean domain modules in PHP 8.3 + Laravel / Symfony with strict static analysis (PHPStan)',
          'Resolve MySQL locking bottlenecks, tune Redis Horizon workers, and eliminate N+1 ORM queries',
          'Expand automated Pest / PHPUnit integration coverage around payment webhooks'
        ]
      },
      {
        company: 'BookingNest Europe',
        roleTitle: 'Staff Backend Engineer (Symfony / PHP)',
        domain: 'Distributed hospitality reservation engine & partner APIs',
        responsibilities: [
          'Decompose legacy monolith workflows into reliable queued jobs and cleanly versioned APIs',
          'Lead database indexing strategies, caching invalidation, and zero-downtime migrations'
        ]
      },
      {
        company: 'DocuVault EU',
        roleTitle: 'Senior Full-Stack Laravel Engineer',
        domain: 'Document automation & e-signature SaaS for SMBs',
        responsibilities: [
          'Build secure RBAC APIs, PDF processing pipelines, and responsive UI integrations'
        ]
      }
    ]
  },
  flutter: {
    label: 'Flutter / Dart Mobile',
    keywords: ['flutter', 'dart', 'riverpod', 'bloc', 'cubit', 'getx', 'pub.dev', 'android', 'ios', 'platform channel', 'widget', 'firebase', 'mobile'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Mobile Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Mobile Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Head of Mobile — Chemistry Call', badgeText: 'Lead' },
      '02-behavioral-leadership-star.md': { title: 'Mobile Manager — STAR Ownership', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Lead — App Retention & Crash-Free', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: '60/120fps Rendering, Isolates & Perf', badgeText: 'Perf' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Dart, Widget Tree, Bloc & Riverpod', badgeText: 'Dart' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Platform Channels, Biometrics & Tests', badgeText: 'Native' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Jank Profiling, Leaks & PR Review', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Streams, Futures & Isolates', badgeText: 'Async' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Offline Cache & Sync', badgeText: 'State' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Custom Slivers & Keys', badgeText: 'UI' },
      '05-system-design-fintech-saas.md': { title: 'Offline-First Mobile App Architecture', badgeText: 'Mobile' },
      '06-salary-contract-negotiation.md': { title: 'Internal Senior Mobile Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Mobile Contract Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'PocketBank EU',
        roleTitle: 'Senior Flutter / Dart Mobile Engineer',
        domain: 'Consumer fintech wallet (iOS & Android) with instant SEPA transfers & biometrics',
        responsibilities: [
          'Build modular Flutter features with BLoC / Riverpod, clean repository layers, and 99.9% crash-free stability',
          'Profile shader compilation, list jank, and isolate background parsing using Flutter DevTools',
          'Bridge native Swift/Kotlin SDKs cleanly over MethodChannels and automate Fastlane CI releases'
        ]
      },
      {
        company: 'FitPulse Health',
        roleTitle: 'Lead Cross-Platform Mobile Developer',
        domain: 'BLE wearable syncing & offline-first workout analytics app',
        responsibilities: [
          'Architect local SQLite/Drift sync queues and responsive custom-painter charts at 60fps',
          'Mentor mobile devs on widget testing, Golden tests, and release train hygiene'
        ]
      },
      {
        company: 'DeliverNow Retail',
        roleTitle: 'Senior Flutter Architect (Remote)',
        domain: 'Real-time courier & live map tracking mobile suite',
        responsibilities: [
          'Optimize battery usage, background geolocation streams, and multi-flavor white-label builds'
        ]
      }
    ]
  },
  python: {
    label: 'Python / Backend & AI',
    keywords: ['python', 'fastapi', 'django', 'flask', 'sqlalchemy', 'celery', 'pytest', 'asyncio', 'pandas', 'pytorch', 'langchain', 'rag'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Python/AI Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Tech Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Engineering — Chemistry Call', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Engineering Manager — STAR Ownership', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Director — Latency & ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'AsyncIO, GIL, Workers & Throughput', badgeText: 'Async' },
      '03b-tech-angular-nx-rxjs.md': { title: 'FastAPI/Django, Pydantic & SQLAlchemy', badgeText: 'Py' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Celery, Postgres, Redis & PyTest', badgeText: 'Data' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Memory Profiling & PR Review', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Async Generators & Concurrency', badgeText: 'def()' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Data Pipelines & Retries', badgeText: 'ETL' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Caching & Rate Limits', badgeText: 'API' },
      '05-system-design-fintech-saas.md': { title: 'Scalable Python API & AI/Worker System', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Promotion Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Contract Rate Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'SignalForge AI',
        roleTitle: 'Senior Python / FastAPI Backend Engineer',
        domain: 'Low-latency ingestion APIs, async worker fleets, and LLM evaluation pipelines',
        responsibilities: [
          'Design typed FastAPI + Pydantic v2 services backed by PostgreSQL, Redis, and Celery/ARQ',
          'Eliminate sync blocking on the asyncio event loop and enforce strict pytest CI coverage',
          'Scale structured data extraction and observability with OpenTelemetry'
        ]
      },
      {
        company: 'LedgerMetrics EU',
        roleTitle: 'Staff Python Data & API Engineer',
        domain: 'Automated financial reporting & multi-source reconciliation platform',
        responsibilities: [
          'Optimize batch ETL jobs, database partitioning, and API latency SLAs'
        ]
      },
      {
        company: 'CloudDoc Automation',
        roleTitle: 'Senior Django / Platform Engineer',
        domain: 'Enterprise workflow SaaS & partner webhook integrations',
        responsibilities: [
          'Refactor high-load ORM queries, build idempotent webhooks, and mentor junior engineers'
        ]
      }
    ]
  },
  devops: {
    label: 'DevOps / SRE & Cloud Platform',
    keywords: ['kubernetes', 'k8s', 'terraform', 'aws', 'gcp', 'azure', 'docker', 'helm', 'ci/cd', 'prometheus', 'grafana', 'sre', 'devops', 'ansible', 'linux'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Cloud/SRE Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU DevOps Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Infrastructure — Reliability Call', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'SRE Manager — Blameless Postmortems', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'FinOps & Uptime ROI Discussion', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Kubernetes, Networking & Zero-Downtime', badgeText: 'K8s' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Terraform IaC, Modules & State Drift', badgeText: 'IaC' },
      '03c-tech-nodejs-payments-testing.md': { title: 'CI/CD Supply Chain, Secrets & SLOs', badgeText: 'CI/CD' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Live Outage Triage & Runbook Review', badgeText: 'Incident' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Log Parsing & Automation', badgeText: 'CLI' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — SLI Alerts & Metrics', badgeText: 'SLO' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Deployment & DNS Triage', badgeText: 'Net' },
      '05-system-design-fintech-saas.md': { title: 'Multi-Region HA Cloud Architecture', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Staff SRE Promotion', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Platform Contract Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'ScaleMesh Cloud',
        roleTitle: 'Senior Site Reliability / Platform Engineer',
        domain: 'Multi-region Kubernetes clusters serving EU fintech traffic with 99.99% SLA',
        responsibilities: [
          'Manage reusable Terraform AWS/GCP infrastructure, Helm GitOps pipelines, and ArgoCD rollouts',
          'Drive MTTR down via Prometheus/Grafana/OpenTelemetry alerting and blameless postmortems',
          'Cut cloud compute spend by right-sizing autoscaling & spot node pools'
        ]
      },
      {
        company: 'SecureVault Infrastructure',
        roleTitle: 'Lead DevSecOps Engineer',
        domain: 'Zero-trust CI/CD pipelines & SOC2/ISO27001 compliant container platforms',
        responsibilities: [
          'Harden supply-chain signing, OIDC workload identity, and zero-downtime blue/green releases'
        ]
      },
      {
        company: 'VervePayments EU',
        roleTitle: 'Principal Cloud Reliability Engineer',
        domain: 'High-availability payment gateways & disaster recovery',
        responsibilities: [
          'Architect active-active failover, database replication, and chaos game-days'
        ]
      }
    ]
  },
  frontend: {
    label: 'Frontend / Full-Stack JS/TS',
    keywords: ['angular', 'react', 'vue', 'svelte', 'typescript', 'javascript', 'next.js', 'rxjs', 'ngrx', 'redux', 'css', 'web components', 'lit', 'webpack', 'vite'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Frontend Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Remote Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Startup Founder / VP Chemistry Call', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Engineering Manager — STAR Leadership', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Director — Growth & UX ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Web Performance, Bundles & Core Vitals', badgeText: 'Perf' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Frontend Architecture, State & Reactivity', badgeText: 'FE' },
      '03c-tech-nodejs-payments-testing.md': { title: 'APIs, BFF, Auth & E2E Reliability', badgeText: 'API' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Render Bugs, Race Conditions & PR Review', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Async Flows & Debounce', badgeText: 'Async' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Client State & Telemetry', badgeText: 'State' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — DOM, Events & Maps', badgeText: 'DOM' },
      '05-system-design-fintech-saas.md': { title: 'Scalable Frontend & BFF Architecture', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Compensation Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU B2B Rate & Scope Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'FinPulse Checkout',
        roleTitle: 'Senior Frontend / Full-Stack Engineer',
        domain: 'High-conversion merchant checkout & real-time analytics dashboards',
        responsibilities: [
          'Optimize bundle footprint, LCP/INP performance, and reactive state management across apps',
          'Build resilient BFF integrations, accessibility-first components, and automated Playwright E2E gates'
        ]
      },
      {
        company: 'Atlas Workspace EU',
        roleTitle: 'Staff UI Platform Engineer',
        domain: 'Collaborative B2B design system & micro-frontend workspace',
        responsibilities: [
          'Lead monorepo governance, shared component library APIs, and rendering performance'
        ]
      },
      {
        company: 'MetricStream SaaS',
        roleTitle: 'Tech Lead — Product Growth & UX',
        domain: 'Self-serve onboarding funnels & experiment-driven SaaS growth',
        responsibilities: [
          'Own activation telemetry, A/B experimentation architecture, and cross-functional mentoring'
        ]
      }
    ]
  },
  general: {
    label: 'Senior Software Engineering',
    keywords: [],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Tech Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Remote Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Startup Founder / VP Chemistry Call', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Engineering Manager — STAR Leadership', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Director — Business Impact & ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Architecture, Latency & Bottlenecks', badgeText: 'Arch' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Core Stack Deep-Dive & Trade-offs', badgeText: 'Stack' },
      '03c-tech-nodejs-payments-testing.md': { title: 'APIs, Data Integrity & Automated Tests', badgeText: 'API' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Production Bug Triage & PR Review', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Async & Concurrency', badgeText: '{ }' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Data & State Modeling', badgeText: 'fn()' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Edge Cases & Contracts', badgeText: 'Edge' },
      '05-system-design-fintech-saas.md': { title: 'Scalable System Design Case Study', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Compensation Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Contract & Offer Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: [
      {
        company: 'Aurora Cloud Systems',
        roleTitle: 'Senior Software Engineer',
        domain: 'High-reliability B2B SaaS platform & partner integrations',
        responsibilities: [
          'Own end-to-end delivery of mission-critical services, automated testing, and telemetry',
          'Partner with product & design to translate business goals into clean, maintainable architecture'
        ]
      },
      {
        company: 'EuroFin Platform',
        roleTitle: 'Staff / Lead Product Engineer',
        domain: 'Distributed EU fintech infrastructure & developer experience',
        responsibilities: [
          'Drive technical standards, PR reviews, latency optimization, and cross-team architecture'
        ]
      },
      {
        company: 'Nexus Remote Tech',
        roleTitle: 'Senior Full-Stack Consultant (Remote)',
        domain: 'Modernization of core customer-facing workflows & API integrations',
        responsibilities: [
          'Eliminate reliability bottlenecks and ship measurable performance & quality improvements'
        ]
      }
    ]
  }
};

export function detectRoleArchetype(rawText = '', profile = {}) {
  const headlineText = `${profile?.headline || ''} ${(profile?.coreStack || []).join(' ')}`.toLowerCase();
  const bodyText = String(rawText || '').toLowerCase();

  let bestKey = 'general';
  let bestScore = 0;

  for (const [key, cfg] of Object.entries(ROLE_ARCHETYPES)) {
    if (key === 'general') continue;
    let score = 0;
    for (const kw of cfg.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (re.test(headlineText)) score += 4;
      else if (re.test(bodyText)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  return bestScore > 0 ? bestKey : 'general';
}

export function normalizeAgentOverrides(rawOverrides, archKey, profile = {}, rawText = '') {
  const arch = ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general;
  const out = {};
  const src = rawOverrides && typeof rawOverrides === 'object' ? rawOverrides : {};
  const stackTag = (profile?.coreStack || []).slice(0, 2).join(' / ');
  const cvLower = `${rawText || ''} ${profile?.headline || ''} ${(profile?.coreStack || []).join(' ')}`.toLowerCase();
  const hasForeignTech = (text) => {
    const tokens = ['angular', 'rxjs', 'ngrx', 'vue', 'svelte'];
    return tokens.some((tok) => new RegExp(`\\b${tok}\\b`, 'i').test(text) && !cvLower.includes(tok));
  };

  for (const [agentId, blueprint] of Object.entries(arch.slots)) {
    const llmSlot = src[agentId];
    const rawTitle = typeof llmSlot === 'string'
      ? llmSlot
      : llmSlot?.title || blueprint.title;
    const title = rawTitle && !hasForeignTech(rawTitle) ? rawTitle : blueprint.title;
    const badgeText = (typeof llmSlot === 'object' ? llmSlot?.badgeText : '') || blueprint.badgeText;
    const focusHint = (typeof llmSlot === 'object' ? llmSlot?.focusHint : '') ||
      (stackTag ? `Focus on ${stackTag} & ${arch.label}` : blueprint.title);
    out[agentId] = {
      title: String(title).trim().slice(0, 56),
      badgeText: String(badgeText).trim().slice(0, 8),
      focusHint: String(focusHint).trim().slice(0, 140)
    };
  }
  return out;
}

export function getAdaptedAgents(baseAgents, activeCv) {
  if (!activeCv || activeCv.id === 'cv-baseline-1') return baseAgents;
  const overrides = activeCv.agentOverrides && Object.keys(activeCv.agentOverrides).length
    ? activeCv.agentOverrides
    : normalizeAgentOverrides(null, detectRoleArchetype(activeCv.rawText, activeCv.profile), activeCv.profile, activeCv.rawText);

  return baseAgents.map((ag) => {
    const ov = overrides[ag.id];
    if (!ov) return ag;
    return {
      ...ag,
      title: ov.title || ag.title,
      badgeText: ov.badgeText || ag.badgeText,
      focusHint: ov.focusHint || ''
    };
  });
}

function buildFallbackFakeJds(archKey, profile = {}) {
  const arch = ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general;
  const stack = (profile?.coreStack || []).slice(0, 6);
  const comp = profile?.targetCompensation || 'Competitive EU Remote Band';

  return arch.fakeJobs.map((tpl, idx) => ({
    id: `fake-jd-${idx + 1}`,
    title: `${tpl.roleTitle} — ${tpl.company}`,
    company: tpl.company,
    roleTitle: tpl.roleTitle,
    summary: `Tailored mock position for ${profile?.candidateName || 'Candidate'} (${profile?.headline || arch.label}). Domain: ${tpl.domain}.`,
    stack: stack.length ? stack : arch.keywords.slice(0, 5),
    compensation: comp,
    responsibilities: tpl.responsibilities,
    requirements: [
      `${profile?.yearsExperience || '4+ years'} hands-on production experience in ${stack.slice(0, 3).join(', ') || arch.label}`,
      'Strong architectural ownership, automated testing discipline, and clear C1 English communication'
    ]
  }));
}

export function normalizeGeneratedJds(rawJds, profile = {}, rawText = '') {
  const archKey = detectRoleArchetype(rawText, profile);
  const fallback = buildFallbackFakeJds(archKey, profile);
  const list = Array.isArray(rawJds) ? rawJds : [];

  const normalized = [];
  for (let i = 0; i < Math.max(3, Math.min(4, list.length || 3)); i += 1) {
    const item = list[i];
    const fb = fallback[i % fallback.length];
    if (!item || typeof item !== 'object') {
      normalized.push(fb);
      continue;
    }
    const company = String(item.company || fb.company).trim();
    const roleTitle = String(item.roleTitle || fb.roleTitle).trim();
    const cleanStack = Array.isArray(item.stack) && item.stack.length ? item.stack.map(String) : fb.stack;
    normalized.push({
      id: `fake-jd-${i + 1}`,
      title: `${roleTitle} — ${company}`,
      company,
      roleTitle,
      summary: String(item.summary || fb.summary).trim(),
      stack: cleanStack,
      compensation: String(item.compensation || fb.compensation).trim(),
      responsibilities: Array.isArray(item.responsibilities) && item.responsibilities.length
        ? item.responsibilities.map(String)
        : fb.responsibilities,
      requirements: Array.isArray(item.requirements) && item.requirements.length
        ? item.requirements.map(String)
        : fb.requirements
    });
  }
  return normalized;
}

export function formatFakeJdAsMarkdown(jd) {
  if (!jd) return '';
  if (jd.content) return jd.content;
  const resp = (jd.responsibilities || []).map((r) => `- ${r}`).join('\n');
  const reqs = (jd.requirements || []).map((r) => `- ${r}`).join('\n');
  return `# ${jd.roleTitle} at ${jd.company}
Compensation / Engagement: ${jd.compensation || 'Competitive Remote'}
Core Stack: ${(jd.stack || []).join(', ')}

## Context
${jd.summary || ''}

## Responsibilities
${resp}

## Key Requirements
${reqs}`.trim();
}

export function getActiveJobDescriptions(staticJds, activeCv) {
  if (!activeCv || activeCv.id === 'cv-baseline-1') return staticJds;
  const list = Array.isArray(activeCv.generatedJds) && activeCv.generatedJds.length
    ? activeCv.generatedJds
    : normalizeGeneratedJds(null, activeCv.profile, activeCv.rawText);

  return list.map((jd) => ({
    id: jd.id,
    title: jd.title || `${jd.roleTitle} — ${jd.company}`,
    company: jd.company,
    roleTitle: jd.roleTitle,
    stack: jd.stack || [],
    compensation: jd.compensation || '',
    summary: jd.summary || '',
    responsibilities: jd.responsibilities || [],
    requirements: jd.requirements || [],
    content: formatFakeJdAsMarkdown(jd)
  }));
}

export function normalizeCvDailyPath(rawDays, baseMorningPath, baseAgents, archKey, profile = {}) {
  const validAgents = new Set(baseAgents.map((a) => a.id));
  const jds = normalizeGeneratedJds(null, profile, '');
  const slots = (ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general).slots;
  const input = Array.isArray(rawDays) ? rawDays : [];
  const stackSample = (profile?.coreStack || []).slice(0, 3).join(', ') || ROLE_ARCHETYPES[archKey]?.label || 'Core Stack';

  return baseMorningPath.map((fallback, idx) => {
    const item = input[idx] || {};
    const byTopic = baseAgents.find((a) => a.topic.toLowerCase() === String(item.topic || '').toLowerCase());
    const agent = validAgents.has(item.agent) ? item.agent : (byTopic?.id || fallback.agent);
    const meta = baseAgents.find((a) => a.id === agent);
    const slotTitle = slots[agent]?.title || fallback.title;
    const rawTitle = String(item.title || '').trim();
    const safeTitle = rawTitle || slotTitle;
    const jdObj = jds[idx % jds.length];
    return {
      day: idx + 1,
      title: safeTitle.slice(0, 48),
      topic: meta?.topic || item.topic || fallback.topic,
      agent,
      jd: jdObj.id,
      focus: String(item.focus || `Drill ${meta?.topic || fallback.topic} using verified CV achievements and ${stackSample}.`).trim()
    };
  });
}

export function buildDynamicAgentDirective({ meta, activeCv, companyName = '' }) {
  const profile = activeCv?.profile || {};
  const firstName = String(profile.candidateName || 'Candidate').trim().split(/\s+/)[0] || 'Candidate';
  const stackList = (profile.coreStack || []).join(', ') || 'their core software stack';
  const achievements = (profile.topAchievements || []).slice(0, 4).map((a) => `- ${a}`).join('\n');
  const gaps = (profile.gapAreas || []).slice(0, 3).map((g) => `- ${g}`).join('\n');

  const topicGuidance = {
    HR: `You are running a sharp 10-minute HR / Recruiter Screening call tailored to ${profile.headline || 'this candidate role'}. Validate their 90-second career story, motivation for moving, communication style, remote setup, and target compensation (${profile.targetCompensation || 'market rate'}). NEVER quiz them on coding or deep architecture—leave technical depth to Engineering.`,
    Behavioral: `You are running a STAR Behavioral & Impact interview. Probe cross-team conflict, ownership, measurable engineering/product ROI, and leadership decisions drawn directly from ${firstName}'s CV projects.`,
    Technical: `You are a Staff Engineer grilling ${firstName} deeply on "${meta?.title || 'Core Architecture'}" and their real production stack (${stackList}). Ask concrete debugging, trade-off, scalability, and testing questions strictly relevant to THEIR domain (never invent unrelated stacks).`,
    'Live Coding': `You are running an Anti-Freeze Verbal Problem Solving & Practical Exercise interview focused on "${meta?.title || 'Core Stack Problem Solving'}" using ${stackList}. Reward structured clarifying questions and clear step-by-step reasoning before jumping into code.`,
    'System Design': `You are a Principal Architect running a 10-minute System Design drill tailored to ${profile.headline || 'the candidate role'} and ${stackList}. Probe requirements clarification, bottlenecks, data flow, failure modes, and observability.`,
    Negotiation: `You are a Hiring Director negotiating scope, level, and compensation (${profile.targetCompensation || 'senior market band'}) for ${firstName}. Push gently on rate/band boundaries while reacting authentically to quantified ROI from their CV.`
  };

  return `# Dynamic Interviewer Directive: ${meta?.title || meta?.topic || 'Technical Interview'}
- Interviewer Persona: ${meta?.avatarName || 'Interviewer'}${companyName ? ` from ${companyName}` : ''} (${meta?.topic || 'Technical'})
- Focus Objective: ${topicGuidance[meta?.topic] || topicGuidance.Technical}
- Candidate Core Stack: ${stackList}
- Candidate Key Highlights:
${achievements || '- Reference concrete deliverables directly from their uploaded CV.'}
${gaps ? `- Coaching Priorities to Probe:\n${gaps}` : ''}
- Strict Domain Rule: Base ALL technical questions, terminology, and scenarios strictly on this candidate's CV and the paired Target Job Description. Address the candidate naturally as ${firstName}.`;
}

export function buildCvAnalysisPrompt({ rawText, notes, baseAgents }) {
  const agentDirectory = baseAgents.map((a) => `${a.id} (${a.topic})`).join(', ');
  return `You are a Principal Engineering Career Strategist helping a software candidate prepare for international interviews in ANY technical role (QA/SDET, Java, .NET/C#, PHP, Flutter, Python, DevOps, Frontend, etc.).
Analyze this uploaded CV carefully and produce:
1. A structured Candidate Profile.
2. Tailored titles for key interviewer tracks matching THIS CV's real tech stack & discipline (agentOverrides).
3. 3 realistic "Fake Job" postings (generatedJds) that fit THIS candidate's role, seniority, stack, and compensation target so they can immediately practice against authentic job ads.
4. A progressive 20-Day Interview Training Path (dailyPath) aligned strictly with THIS CV's projects, metrics, and stack.

UPLOADED CV CONTENT:
${String(rawText || '').slice(0, 7200)}

EXTRA FOCUS NOTES: ${notes || 'Standard senior/mid-to-senior international remote engineering interview preparation.'}

AVAILABLE AGENT FILENAMES (for dailyPath.agent & agentOverrides keys):
${agentDirectory}

Return ONE strict JSON object with EXACTLY these keys:
{
  "candidateName": "Full name from CV",
  "headline": "Candidate's role headline (e.g. Senior QA Automation Engineer / Java Spring Developer)",
  "location": "Location / timezone",
  "yearsExperience": "e.g. 6+ years",
  "targetCompensation": "Realistic comp/rate target inferred from location/seniority",
  "coreStack": ["tech1", "tech2", "tech3", "tech4", "tech5", "tech6"],
  "topAchievements": ["Quantified achievement from CV 1", "Achievement 2", "Achievement 3"],
  "gapAreas": ["Interview trap or gap to drill 1", "Gap 2", "Gap 3"],
  "profilePrompt": "Dense 100-140 word English briefing summarizing this candidate's real companies, metrics, stack, and interview angles.",
  "agentOverrides": {
    "03-technical-deep-dive-architecture.md": {"title": "Role-specific architecture topic from CV", "badgeText": "ShortTag"},
    "03b-tech-angular-nx-rxjs.md": {"title": "Role-specific core language/framework/QA tool from CV ONLY (this key is a legacy ID; NEVER mention Angular/RxJS/Nx unless in CV!)", "badgeText": "Core"},
    "03c-tech-nodejs-payments-testing.md": {"title": "Role-specific API/database/testing topic from CV", "badgeText": "API"},
    "03d-tech-bug-triage-and-pr-review.md": {"title": "Role-specific triage/debugging topic from CV", "badgeText": "Debug"},
    "04-live-coding-anti-freeze-trainer.md": {"title": "Role-specific live problem solving from CV", "badgeText": "Solve"},
    "05-system-design-fintech-saas.md": {"title": "Role-specific system design case from CV", "badgeText": "SYS"}
  },
  "generatedJds": [
    {
      "company": "Realistic fictional company name",
      "roleTitle": "Exact target job title matching CV",
      "summary": "2-sentence overview of product & team",
      "stack": ["tech1", "tech2", "tech3", "tech4"],
      "compensation": "Realistic salary or B2B hourly band",
      "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
      "requirements": ["Requirement 1", "Requirement 2"]
    }
  ],
  "dailyPath": [
    {
      "day": 1,
      "topic": "HR" | "Technical" | "Live Coding" | "Behavioral" | "System Design" | "Negotiation",
      "title": "Short 3-5 word step title referencing CV stack/projects",
      "agent": "Exact agent filename from list above",
      "focus": "1-2 sentence drill objective specifically exercising a metric, system, or gap from THIS CV"
    }
  ]
}
Include ALL 3 generatedJds and ALL 20 days (day 1..20) in dailyPath.`;
}

export function buildFakeJobPrompt({ profile, rawText, customFocus = '' }) {
  return `Generate 1 fresh, realistic fictional Job Description ("fake job") specifically designed for this candidate to practice interviewing against.

CANDIDATE:
- Name: ${profile?.candidateName || 'Candidate'}
- Headline: ${profile?.headline || 'Software Engineer'}
- Core Stack: ${(profile?.coreStack || []).join(', ')}
- Achievements: ${(profile?.topAchievements || []).slice(0, 3).join('; ')}
- Target Compensation: ${profile?.targetCompensation || 'Market competitive'}
- Requested Twist / Domain Focus: ${customFocus || 'New international remote company with interesting technical challenges matching their CV'}

CV EXCERPT:
${String(rawText || '').slice(0, 2600)}

Return ONE strict JSON object:
{
  "company": "Distinct realistic fictional company name",
  "roleTitle": "Role title calibrated to this candidate's exact craft & seniority",
  "summary": "2 crisp sentences describing the product, scale, and mission",
  "stack": ["tech1", "tech2", "tech3", "tech4", "tech5"],
  "compensation": "Realistic salary or remote contract band",
  "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"]
}`;
}
