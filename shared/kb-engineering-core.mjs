/**
 * Senior Domain Knowledge Bases: Application & Platform Engineering
 * Roles: frontend, java, dotnet, python, php, flutter
 */

export const KB_ENGINEERING_CORE = {
  frontend: {
    mandate: 'Ship ultra-responsive, accessible, secure web experiences under real-world mobile CPU/network constraints with disciplined bundle budgets, state locality, and clean backend contracts.',
    mentalModels: [
      'Core Web Vitals Causality: LCP (<2.5s via critical path inline CSS, fetchpriority="high", preconnect, SSR/streaming), INP (<200ms via task chunking / scheduler.yield, avoiding long synchronous handlers), CLS (<0.1 via intrinsic aspect ratios & reserved skeleton bounds).',
      'Reactive State & Backpressure: RxJS switchMap (search-ahead) vs exhaustMap (payment/form submit double-click lock) vs mergeMap; Angular Signals fine-grained dependency tracking vs bloated global store churn.',
      'Browser Security Boundaries: Stored/Reflected DOM XSS defense (never trust unescaped innerHTML sinks, enforce strict CSP), auth tokens in HttpOnly SameSite cookies via BFF rather than localStorage.',
      'Modular Isolation & Micro-Widgets: Shadow DOM style encapsulation or scoped tokens, strict CDN immutable hash caching + short-lived loader manifests.'
    ],
    probeLadders: [
      { claim: 'I optimize React/Angular by adding memo/OnPush everywhere', probe: 'Push on profiling evidence first (flamegraph long tasks, unnecessary parent state lifting, list virtualization) rather than masking leaky reference mutations.' },
      { claim: 'We store the JWT in localStorage for SPA convenience', probe: 'Challenge with any third-party analytics/tag-manager XSS blast radius and walk through HttpOnly cookie + BFF CSRF defense.' },
      { claim: 'The checkout bundle is 450KB gzipped', probe: 'Drill dependency audit, dynamic route/feature chunking, deferring non-critical SDKs past hydration, and Edge/CDN waterfall elimination.' }
    ],
    redFlags: [
      'Shipping uncleaned subscriptions / timer listeners causing memory leaks across SPA navigation.',
      'Treating accessibility (`aria-*`, keyboard traps, contrast) as an optional post-launch cosmetic chore.',
      'Ignoring mobile 4G latency and mid-tier Android main-thread CPU throttling.'
    ],
    roundRubrics: {
      HR: 'Assess TypeScript depth, multi-framework adaptability (Angular/React/Web Components), fullstack BFF familiarity, and remote async rigor.',
      Behavioral: 'Probe debugging an intermittent race condition in production checkout, championing Core Web Vitals vs Marketing heavy pixels, and cross-squad ownership.',
      Technical: 'Drill INP/LCP diagnostics, RxJS/Signals/React concurrent pitfalls, CORS/Auth BFF cookies, Shadow DOM, and Playwright E2E flakiness prevention.',
      'Live Coding': 'Trace async race conditions (double-click submit, stale response overwrite), clean DOM widget encapsulation, or optimize degraded rendering flow verbally/step-by-step.',
      'System Design': 'Design a globally embedded SaaS merchant widget (<18KB) or resilient micro-frontend checkout architecture with strict versioning and observability.',
      Negotiation: 'Calibrate Senior/Staff Frontend scope, full-stack TS premium, equity/remote setup allowance, and target base.'
    },
    powerPhrases: [
      'I verify runtime behavior with the Performance flamegraph before refactoring—splitting long INP interaction tasks matters far more than blind micro-memoization.',
      'For payments and sensitive sessions, keeping credentials out of JavaScript-accessible storage behind an HttpOnly BFF closes the biggest XSS exfiltration path.'
    ]
  },

  java: {
    mandate: 'Engineer high-throughput, predictable JVM services with clean transaction boundaries, disciplined connection-pool/GC economics, and bulletproof asynchronous delivery guarantees.',
    mentalModels: [
      'JVM Memory & GC Trade-Offs: Throughput vs tail-latency pause targets (G1GC default balanced vs ZGC sub-millisecond low-pause for large heaps; beware Allocation Rate & Survivor pressure).',
      'Concurrency & Virtual Threads (Java 21+): Project Loom Virtual Threads shine on I/O-bound tasks ONLY when avoiding carrier thread pinning inside synchronized blocks holding I/O locks (prefer ReentrantLock).',
      'Spring / Hibernate Database Discipline: Prevent N+1 queries (JOIN FETCH / EntityGraph / batch_size), NEVER keep @Transactional open across external HTTP/Kafka calls (exhausts HikariCP connections!).',
      'Distributed Reliability: Transactional Outbox pattern with CDC/Debezium or poller + idempotent Kafka consumers (dedupe key / unique DB constraint).'
    ],
    probeLadders: [
      { claim: 'Traffic spiked so I bumped HikariCP maxPoolSize from 20 to 200', probe: 'Challenge with PostgreSQL lock/context-switch saturation (Little’s Law)—explain why smaller pools + PgBouncer + faster queries scale higher.' },
      { claim: 'We wrapped the orchestrator method in @Transactional', probe: 'Ask what happens when the payment gateway times out in 15s while holding row locks and a DB connection.' },
      { claim: 'We adopted Kafka for everything', probe: 'Probe partition ordering vs consumer lag rebalancing storms, poison-pill DLQs, and dual-write race without Transactional Outbox.' }
    ],
    redFlags: [
      'Mixing domain entities directly with REST DTOs causing unintended lazy-loading serialization loops or over-fetching.',
      'Swallowing InterruptedException or launching unbounded ExecutorService queues causing OOM under backpressure.',
      'Ignoring database lock ordering (`SELECT ... FOR UPDATE` deadlocks) under concurrent financial writes.'
    ],
    roundRubrics: {
      HR: 'Check Java 17/21+ modernization fluency, Spring Boot vs reactive experience, distributed transactional systems, and EU/US senior expectations.',
      Behavioral: 'Probe chasing a nasty memory leak or Hikari pool exhaustion outage, migrating legacy Java 8/Monolith safely, and code review mentorship.',
      Technical: 'Drill @Transactional propagation/proxy traps, N+1 diagnostics, JVM GC logs/heap dumps, Virtual Threads pinning, and Kafka outbox idempotency.',
      'Live Coding': 'Inspect concurrency deadlock, SQL/JPA N+1 bottleneck, or idempotent retry/outbox design step-by-step with edge-case reasoning.',
      'System Design': 'Architect a high-throughput JVM payment/ledger pipeline handling 5k TPS with strict exactly-once accounting invariants and graceful backpressure.',
      Negotiation: 'Align Senior/Staff Backend band, fintech/payments domain premium, on-call compensation, and EU B2B vs employment terms.'
    },
    powerPhrases: [
      'Holding a database transaction open across an external HTTP call is the fastest way to exhaust HikariCP—I separate local state transitions via Transactional Outbox.',
      'Before increasing DB connection pools, check lock contention and query plans; fewer queued connections almost always outperform 200 contending threads.'
    ]
  },

  dotnet: {
    mandate: 'Build low-allocation, rock-solid .NET / ASP.NET Core distributed systems that avoid thread-pool starvation, leverage modern C# memory primitives, and degrade cleanly under downstream load.',
    mentalModels: [
      'Kestrel Async Discipline: NEVER block async code with `.Result` / `.Wait()` (sync-over-async causes instant thread-pool starvation and 1,000ms ramp latency pauses!).',
      'Zero-Allocation Hot Paths: Use `Span<T>`, `Memory<T>`, `ArrayPool<T>`, `ValueTask` only for synchronously-completing hot caches, preventing Large Object Heap (>85KB) fragmentation & Gen2 GC pauses.',
      'EF Core Mastery: Default to `AsNoTracking()` on read queries, avoid client-side evaluation traps, use Split Queries for multi-collection includes, and enforce explicit migration scripts cleanly.',
      'Distributed Resilience (.NET Aspire / Polly v8): Combine short HTTP timeouts, circuit breakers, jittered exponential retries for idempotent calls, and MassTransit / Wolverine Transactional Outbox.'
    ],
    probeLadders: [
      { claim: 'Our API freezes under sudden load spikes even at 30% CPU', probe: 'Diagnose thread-pool starvation from blocking sync-over-async calls, missing ConfigureAwait discipline in legacy libraries, or exhausted HttpClient sockets (IHttpClientFactory).' },
      { claim: 'EF Core handles our queries cleanly', probe: 'Push on Cartesian explosion with nested `.Include()`, unbounded dynamic LINQ expressions bypassing query plan cache, and optimistic concurrency tokens (`rowversion`).' },
      { claim: 'We instantiate new HttpClient per request', probe: 'Expose TIME_WAIT socket exhaustion and stale DNS caching vs typed IHttpClientFactory SocketsHttpHandler pooling.' }
    ],
    redFlags: [
      'Using `async void` outside top-level UI event handlers causing unhandled process crashes.',
      'Disposing EF `DbContext` prematurely or sharing a single scoped `DbContext` across parallel `Task.WhenAll` tasks (not thread-safe!).',
      'Misusing `ValueTask` (awaiting twice or `.GetAwaiter().GetResult()` synchronously).'
    ],
    roundRubrics: {
      HR: 'Validate .NET 8/9+ cloud-native depth (vs legacy .NET Framework migration), SQL Server/Postgres tuning, Azure/AWS CI/CD, and seniority scope.',
      Behavioral: 'Probe resolving production Gen2 GC / thread-pool outages, decoupling monolithic WCF/MVC into modular clean services, and mentoring mid-tier C# engineers.',
      Technical: 'Drill async state machine overhead, Span<T>/LOH allocations, IHttpClientFactory DNS lifetime, EF Core concurrency & N+1, and Polly circuit breaking.',
      'Live Coding': 'Trace thread-pool starvation, EF Core Cartesian query bug, or idempotent MassTransit saga compensation flow cleanly.',
      'System Design': 'Design a resilient multi-tenant .NET Core order & billing platform using Outbox, CQRS read projections, Redis stampede protection, and OpenTelemetry.',
      Negotiation: 'Calibrate Principal/Senior .NET compensation, Azure/Cloud architecture ownership, and hybrid/remote contract terms.'
    },
    powerPhrases: [
      'Under load, sync-over-async blocking starves Kestrel’s thread pool long before CPU hits 100%—async all the way down with CancellationToken propagation is non-negotiable.',
      'I default EF read paths to AsNoTracking, guard against multi-Include Cartesian explosions, and rely on Outbox tables rather than fragile two-phase distributed commits.'
    ]
  },

  python: {
    mandate: 'Deliver clean, production-hardened Python & AI backends that respect runtime GIL/async boundaries, enforce strict schema validation at I/O edges, and measure LLM/data quality quantitatively.',
    mentalModels: [
      'Concurrency Truth (GIL vs AsyncIO vs Multiprocessing): AsyncIO excels ONLY for non-blocking network I/O; one blocking `requests.get()` or CPU pandas/JSON loop freezes the entire Uvicorn worker event loop!',
      'Type Safety & Boundary Contracts: Pydantic v2 strict models at API/LLM edges, async SQLAlchemy explicit session lifecycle (avoiding implicit greenlet/lazy-load errors in async endpoints).',
      'Resilient Background Workers: Celery / ARQ / Dramatiq tasks must be idempotent, bounded by hard timeouts, separated into priority queues, and backed by Dead Letter Queues.',
      'Applied AI / RAG Engineering: Hybrid BM25 + dense vector retrieval + reranking, deterministic prompt regression evals (Recall@k, groundedness, latency p99 TTFT), semantic caching, and token budget caps.'
    ],
    probeLadders: [
      { claim: 'I converted all endpoints to async def in FastAPI so throughput multiplied', probe: 'Inspect what happens if they still call blocking boto3, sync SQLAlchemy, or CPU tokenization directly on the event loop without `run_in_threadpool` or separate workers.' },
      { claim: 'Our RAG pipeline answers accurately in testing', probe: 'Challenge eval rigor: chunk boundary loss on tables, stale document tombstones on deletion, prompt injection isolation, and cost/TTFT under 50 concurrent users.' },
      { claim: 'Celery runs our async jobs fine', probe: 'Ask about visibility timeout collisions on long tasks, acks_late duplicate delivery requiring idempotency keys, and worker OOM recovery.' }
    ],
    redFlags: [
      'Shipping untyped dict soups across service boundaries without Pydantic validation.',
      'Evaluating AI features by "vibes on 3 happy prompts" with zero automated regression evals or cost telemetry.',
      'Mutating shared module-level caches / defaults (`def fn(items=[]):`) or ignoring worker memory bloat.'
    ],
    roundRubrics: {
      HR: 'Differentiate pure web SaaS Python (Django/FastAPI) vs AI/MLOps/Data engineering depth, scale handled, and testing culture.',
      Behavioral: 'Probe diagnosing silent memory leaks or event-loop freezes in prod, taming legacy untyped Python monoliths, and stopping AI hype without ROI.',
      Technical: 'Drill FastAPI async vs threadpool traps, Python memory/GIL, async SQLAlchemy pooling, Celery idempotency/DLQ, and RAG eval + streaming SSE architecture.',
      'Live Coding': 'Trace event-loop starvation, idempotent queue consumer, or structured streaming LLM tool-call validation step-by-step.',
      'System Design': 'Architect a scalable FastAPI + Worker + Hybrid RAG & Streaming SaaS backend with tenant isolation, semantic caching, and evaluation CI gates.',
      Negotiation: 'Calibrate Senior Python / Applied AI Engineer compensation, GPU/inference R&D scope, and equity.'
    },
    powerPhrases: [
      'Putting `async def` on an endpoint calling blocking I/O or CPU work is worse than synchronous workers because it stalls every other concurrent coroutine on the loop.',
      'AI features aren’t production-ready without offline retrieval/faithfulness evals, strict token cost ceilings, and graceful fallback when upstream inference degrades.'
    ]
  },

  php: {
    mandate: 'Modernize and scale PHP (8.3+/Laravel/Symfony) platforms cleanly—bridging shared-nothing speed with safe persistent-worker patterns, strict queue idempotency, and incremental legacy decomposition.',
    mentalModels: [
      'Lifecycle Fluency (PHP-FPM vs Octane/Swoole/RoadRunner): FPM guarantees request isolation at process cost; long-lived Octane workers deliver blazing speed ONLY if static state, DI singletons, and DB connections don’t leak across tenants!',
      'Database & Memory Discipline: Eliminate Eloquent N+1 via `with()` + `Model::preventLazyLoading()` in non-prod; stream big exports with `chunkById()` / `lazyById()` instead of loading 200k models into memory.',
      'Queue & Concurrency Safety: Laravel Horizon supervisor sizing, database row locks (`lockForUpdate()` / optimistic version columns), idempotent webhook jobs (`ShouldBeUnique`), and dead-letter handling.',
      'Strangler Fig Modernization: Introduce strict PHPStan (level 8+), typed DTOs, modular domain boundaries, and contract tests before carving out hot paths incrementally.'
    ],
    probeLadders: [
      { claim: 'We enabled Laravel Octane and requests got 5x faster', probe: 'Probe hidden cross-request state leaks: auth context bleeding into next user, stale static arrays, or unclosed DB transactions inside long-lived workers.' },
      { claim: 'Our cron job times out processing monthly invoices', probe: 'Push beyond raising `max_execution_time`: design chunked fan-out jobs with idempotent invoice keys, dead-letter retries, and zero double-billing.' },
      { claim: 'We maintain a 10-year-old legacy monolith', probe: 'Test pragmatic refactoring discipline (characterization tests + PHPStan + Strangler interfaces) over dangerous full-system rewrites.' }
    ],
    redFlags: [
      'Putting business logic, SQL queries, and third-party HTTP retries all inside bloated Controllers or Eloquent Model observers.',
      'Running long synchronous exports/webhooks inside HTTP PHP-FPM workers exhausting pool capacity.',
      'Neglecting SQL injection/mass-assignment (`$guarded = []`) and signed webhook verification.'
    ],
    roundRubrics: {
      HR: 'Check modern PHP 8.2/8.3+ typed fluency, Laravel/Symfony ecosystem experience, MySQL/Postgres tuning, and scaling SaaS traffic.',
      Behavioral: 'Probe rescuing bloated FPM pools during traffic surges, winning buy-in for PHPStan/CI testing on legacy code, and critical checkout bug postmortems.',
      Technical: 'Drill PHP-FPM vs Octane memory leaks, Eloquent N+1/lazy loading, `lockForUpdate` vs deadlocks, Horizon queue throughput, and OPcache/HTTP caching.',
      'Live Coding': 'Refactor tightly coupled payment webhook / bulk export handler into idempotent queued pipeline with safe locking and error recovery.',
      'System Design': 'Architect multi-tenant B2B SaaS platform in Laravel/Symfony handling 50M+ queued jobs/month, webhook fan-out, and read/write DB separation.',
      Negotiation: 'Calibrate Lead/Senior Backend PHP band, DevOps/Cloud ownership premium, and remote/B2B engagement.'
    },
    powerPhrases: [
      'Shared-nothing PHP-FPM forgives messy globals, whereas Octane/RoadRunner requires obsessive hygiene around singleton state and tenant context cleanup.',
      'We stabilize legacy PHP safely using PHPStan strict static analysis, characterization tests around critical money paths, and incremental queue extraction.'
    ]
  },

  flutter: {
    mandate: 'Craft butter-smooth 60/120fps cross-platform mobile apps with strict frame-budget awareness, true offline-first local persistence, and reliable native/store release engineering.',
    mentalModels: [
      'Frame Budget Discipline (<16.6ms @60Hz / <8.3ms @120Hz): Keep heavy JSON decoding, crypto, and image resizing off the UI thread using `Isolate.run()`; minimize expensive `Opacity`/`saveLayer` passes.',
      'Granular Rebuild Tree Control: Push state builders down to leaves (`select()` in Riverpod/Bloc), use `const` constructors, separate `RepaintBoundary` layers around heavy animations/maps.',
      'Offline-First Sync Engine: Local Drift/SQLite source of truth driving UI streams reactively, queued idempotent mutation outbox, conflict-resolution strategy, and graceful token refresh locking.',
      'Native Interop & Store Hygiene: MethodChannel/Pigeon typed contracts for biometrics/payments/background tasks, Firebase Crashlytics breadcrumbs, staged store rollouts, and deep-link cold-start recovery.'
    ],
    probeLadders: [
      { claim: 'The scrolling feed lags on mid-range Android devices', probe: 'Diagnose systematic causes: synchronous `jsonDecode` on UI isolate, unbounded image memory cache (`cacheWidth`), missing `ListView.builder`, or Impeller/Skia shader jank.' },
      { claim: 'Our app works offline with cached API responses', probe: 'Push on real write offline conflicts, queue ordering on reconnect, expired auth token race across 5 parallel queued mutations, and partial sync failure UI.' },
      { claim: 'We put everything in one global Bloc/Provider', probe: 'Challenge cascading rebuild storms and lifecycle cleanup when users navigate deep nested tabs.' }
    ],
    redFlags: [
      'Calling async side-effects directly inside `build()` or neglecting `TextEditingController`/`StreamSubscription` disposal.',
      'Testing ONLY on flagship iPhone simulators instead of throttled Android devices with killed background state.',
      'No strategy for forced app upgrades when backend API contracts evolve.'
    ],
    roundRubrics: {
      HR: 'Explore Production App Store / Play Store launches, architecture pattern (Bloc vs Riverpod), native Swift/Kotlin bridge depth, and test automation.',
      Behavioral: 'Probe resolving an iOS/Android crash regression post-release, bridging UI designer expectations with 120fps limits, and mentoring junior mobile devs.',
      Technical: 'Drill Dart Isolates, Widget/Element/RenderObject tree, RepaintBoundary, Drift offline sync + token refresh mutex, and Golden/Integration tests.',
      'Live Coding': 'Diagnose frame drop & memory leak in nested animated list or walk through offline optimistic mutation queue with retry/conflict state machine.',
      'System Design': 'Architect a mobile Fintech/Consumer app (Biometrics, Push Deep-Links, Offline Outbox, Modular Feature Packages, Fastlane CI/CD & Telemetry).',
      Negotiation: 'Calibrate Senior/Lead Mobile scope, iOS/Android dual-platform ownership leverage, and total comp expectations.'
    },
    powerPhrases: [
      'When UI jank appears, I inspect the Dart DevTools frame chart first to separate UI-thread Dart rebuild/JSON stalls from Raster-thread overdraw and oversized textures.',
      'Real offline-first isn’t caching GET requests—it means a local reactive SQLite source of truth paired with an idempotent, mutex-protected sync outbox.'
    ]
  }
};
