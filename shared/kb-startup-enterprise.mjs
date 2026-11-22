/**
 * Senior Domain Knowledge Bases: Startup & Enterprise Completion Pack
 * Roles: android, cpp, tpm, csm, people
 */

export const KB_STARTUP_ENTERPRISE = {
  android: {
    mandate: 'Build crash-free, battery-friendly, 120Hz Android apps using modern Kotlin structured concurrency, stable Jetpack Compose rendering, and resilient offline persistence.',
    mentalModels: [
      'Kotlin Structured Concurrency: Use `viewModelScope` + `StateFlow`/`SharedFlow` properly; respect `repeatOnLifecycle(STARTED)` so backgrounded flows stop burning battery and never leak Activities.',
      'Jetpack Compose Stability & Recomposition: Avoid unstable collections/lambdas forcing full-screen recompositions; leverage Compose Compiler metrics, `@Immutable`/`@Stable`, and `remember`/`derivedStateOf`.',
      'Offline & Background Resilience: Room local single-source-of-truth + `WorkManager` with network constraints/backoff for guaranteed deferred sync; survive OS process death cleanly via `SavedStateHandle`.',
      'ANR & Performance Engineering: Eliminate main-thread disk/SharedPreferences/SQLite calls, monitor StrictMode + Play Vitals ANR/Cold Start benchmarks, and optimize APK/AAB size with R8 shrinking.'
    ],
    probeLadders: [
      { claim: 'We use GlobalScope or CoroutineScope(Dispatchers.IO) for background fetches', probe: 'Expose structured concurrency leaks: orphaned jobs outliving screens, swallowed exceptions, and missing cancellation propagation.' },
      { claim: 'Compose UI janks while scrolling lists', probe: 'Drill `LazyColumn` stable `key`s, unstable data classes triggering excessive recomposition, baseline profiles, and debug vs release R8 measurement.' },
      { claim: 'We save draft state in ViewModel properties', probe: 'Challenge Android OS process death when user switches to camera/banking app—verify `SavedStateHandle` + Room recovery.' }
    ],
    redFlags: [
      'Running blocking I/O or heavy JSON parsing on `Dispatchers.Main` causing 5-second ANR kills.',
      'Leaking `Context` / `Activity` references inside singletons or uncancelled coroutines.',
      'Ignoring Play Store API-level permission changes, scoped storage, and R8 obfuscation crash mapping.'
    ],
    roundRubrics: {
      HR: 'Validate modern Kotlin/Compose production apps on Google Play, legacy XML/Java migration experience, and crash-free Play Vitals track record.',
      Behavioral: 'Probe diagnosing a high-impact ANR spike across fragmented Android OEMs, migrating XML to Compose safely, and partnering closely with iOS peers.',
      Technical: 'Drill Kotlin Coroutines/Flow cancellation, Compose stability/recomposition, Room + WorkManager offline sync, Hilt/DI scoping, and R8/Baseline Profiles.',
      'Live Coding': 'Fix a leaking `Flow` collection / unstable Compose list jank OR design a process-death-safe offline mutation worker with Room + WorkManager.',
      'System Design': 'Architect a modular multi-feature Android app (Offline Room Sync, WorkManager Outbox, Biometric Keystore, Deep Links, Play Vitals & CI).',
      Negotiation: 'Calibrate Senior/Staff Android compensation, OEM/device lab support, and remote/equity terms.'
    },
    powerPhrases: [
      'ViewModels survive configuration changes, NOT Android OS process death—critical in-flight workflows must checkpoint to `SavedStateHandle` or Room.',
      'Before chasing micro-optimizations in Jetpack Compose, I run Layout Inspector recomposition counts and Baseline Profiles on a release R8 build.'
    ]
  },

  cpp: {
    mandate: 'Engineer deterministic, zero-overhead C/C++20 systems with rock-solid RAII ownership, zero undefined behavior, hardware-aware cache locality, and sanitizer-verified concurrency.',
    mentalModels: [
      'RAII & Ownership Discipline: Encode resource lifetime strictly via stack objects, `std::unique_ptr`, and Rule of Zero/Five; reserve `std::shared_ptr` only for genuine shared ownership (beware atomic refcount overhead & cycles).',
      'Hardware & Memory Locality: Structure-of-Arrays (SoA) vs Array-of-Structures (AoS), L1/L2 cache-line alignment (`alignas(64)`) to prevent multi-core false sharing, and avoiding heap fragmentation via custom arena/pool allocators.',
      'Undefined Behavior & Safety Gates: Eliminate data races, dangling references (`std::string_view` outliving source!), signed overflow, and strict aliasing violations; enforce ASan, UBSan, TSan, and fuzzing in CI.',
      'Concurrency & Lock-Free Realism: Understand `std::memory_order` (`acquire`/`release` vs `seq_cst`), prefer simple coarse locks until profiling proves contention, and keep critical sections syscall-free.'
    ],
    probeLadders: [
      { claim: 'We replaced raw pointers with `std::shared_ptr` everywhere for safety', probe: 'Challenge atomic control-block cache-line bouncing across threads, hidden reference cycles, and ambiguous ownership vs `std::unique_ptr` + non-owning references.' },
      { claim: 'Our multi-threaded counter uses atomics so it scales linearly', probe: 'Expose CPU false sharing when adjacent thread counters sit on the same 64-byte cache line causing MESI invalidation storms.' },
      { claim: 'We return `std::string_view` to avoid copies', probe: 'Probe lifetime dangling traps when binding `string_view` to temporary `std::string` objects.' }
    ],
    redFlags: [
      'Hand-rolling `new`/`delete` across exception-throwing code paths instead of RAII.',
      'Writing clever lock-free atomics with `memory_order_relaxed` without proving memory ordering invariants or testing under TSan.',
      'Optimizing blindly without `perf`/VTune flamegraphs or micro-benchmarking cache misses.'
    ],
    roundRubrics: {
      HR: 'Validate C++17/20 domain (HFT/fintech, embedded/RTOS, database/storage, graphics/robotics), build tooling (CMake/Bazel), and ABI/cross-platform rigor.',
      Behavioral: 'Probe hunting down a production heisenbug/memory corruption crash, modernizing legacy C/C++98 safely, and enforcing sanitizer gates.',
      Technical: 'Drill RAII/Rule of Five, move semantics/NRVO, `string_view` lifetimes, cache-line false sharing, virtual dispatch vs templates, and ASan/TSan/perf.',
      'Live Coding': 'Spot dangling `string_view`/iterator invalidation, design a lock-free SPSC ring buffer or custom fixed-block arena allocator cleanly.',
      'System Design': 'Architect a sub-millisecond market/telemetry ingestion engine in C++20 with bounded ring buffers, zero-alloc hot path, and deterministic recovery.',
      Negotiation: 'Calibrate Staff/Senior C++ Systems band, low-latency/embedded scarcity premium, and equity/bonus terms.'
    },
    powerPhrases: [
      'Defaulting to `std::unique_ptr` clarifies ownership immediately; reaching for `shared_ptr` everywhere adds atomic cache-line traffic and hides lifetime bugs.',
      'Hardware performance starts with data layout—eliminating false sharing and pointer chasing beats micro-tweaking instructions every time.'
    ]
  },

  tpm: {
    mandate: 'Turn ambiguous, high-risk multi-team initiatives into predictable on-time launches by surfacing hidden dependencies early, maintaining crisp critical-path truth, and driving executive escalation before dates slip.',
    mentalModels: [
      'Critical Path & Dependency Mapping: Identify the longest chain of blocking cross-squad, InfoSec, Legal, and vendor deliverables; track buffers explicitly rather than padded Gantt fantasies.',
      'RAID Governance (Risks, Assumptions, Issues, Dependencies): Every Red/Amber risk requires an owner, trigger threshold, concrete mitigation plan, and explicit decision deadline.',
      'Launch Readiness & Go/No-Go Gates: Enforce objective exit criteria (load tests passed, rollback verified, CS/Support runbooks live, feature flags staged, compliance sign-off) before green-lighting launch.',
      'Executive Communication Clarity: Lead with BLUF (Bottom Line Up Front)—Green/Amber/Red status, exact schedule/scope impact, options considered, and the single decision needed from leadership.'
    ],
    probeLadders: [
      { claim: 'I track all teams in Jira and send weekly status emails', probe: 'Challenge administrative clerk anti-pattern: how did you spot a silent API contract mismatch 4 weeks BEFORE integration failed, and force technical resolution?' },
      { claim: 'An upstream platform team slipped by 3 weeks', probe: 'Probe concrete recovery levers: decoupling via mocked contract/stub, trimming P1 launch scope, shifting critical-path sequencing, or escalating trade-offs to VP Eng.' },
      { claim: 'Everyone agreed to the launch date in kickoff', probe: 'Ask how you validated hidden assumptions (InfoSec audit queue, App Store review, DB migration window, partner QA) rather than accepting optimistic nods.' }
    ],
    redFlags: [
      'Acting as a passive meeting scheduler/note-taker with zero technical literacy to challenge engineering estimates.',
      'Reporting "Green" status until 48 hours before launch ("watermelon reporting": green outside, red inside).',
      'Solving missed dates by pressuring squads to skip QA/security/observability gates.'
    ],
    roundRubrics: {
      HR: 'Assess program complexity (number of squads, regulated launches, migrations, M&A cutovers), technical depth, and Agile/Scrum vs enterprise program range.',
      Behavioral: 'Probe rescuing a red cross-org launch, challenging an overly optimistic Director/EM estimate, and killing unnecessary process bureaucracy.',
      Technical: 'Drill critical-path dependency unblocking, API/migration rollout sequencing, Go/No-Go checklists, RAID escalation, and flow/predictability metrics.',
      'Live Coding': 'Live Program Rescue Case: 6-squad enterprise release faces 3-week InfoSec + Payments API slip—re-baseline critical path, cut scope, and draft VP decision options.',
      'System Design': 'Design cross-org quarterly planning, dependency intake, release train governance, and incident/launch readiness operating cadence for 120 engineers.',
      Negotiation: 'Calibrate Staff TPM / Principal Program Manager leveling, org-wide authority scope, and total compensation.'
    },
    powerPhrases: [
      'Watermelon status reports kill executive trust—I surface Amber risks the week a dependency assumption breaks, paired with two concrete scope-or-date trade-off options.',
      'My job isn’t chasing Jira tickets; it’s protecting the critical path, exposing integration assumptions early, and ensuring Go/No-Go readiness is objective.'
    ]
  },

  csm: {
    mandate: 'Compound Net Dollar Retention (NRR) by turning post-sale onboarding into measurable customer business outcomes, predicting churn months ahead via health telemetry, and turning renewals into structured expansion.',
    mentalModels: [
      'Outcome-Driven Lifecycle (Onboarding -> TTFV -> Adoption -> EBR/QBR -> Expansion): Customers renew for realized ROI against their original buying business case—not because they liked support tickets.',
      'Multi-Signal Customer Health Scoring: Combine Product Usage Depth (key sticky workflows, seat utilization), Executive Sponsor Stability (champion turnover = instant Red!), Support Escalation Velocity, and NPS.',
      'Executive Business Reviews (EBR/QBR): Never read usage slide dumps—anchor on ROI delivered vs target, benchmark peers, align upcoming roadmap value, and lock mutual next-90-day success plan.',
      'Churn Rescue & Escalation Triage: Distinguish saveable operational/adoption friction from structural bad-fit deals; mobilize Product/Eng cleanly with quantified ARR-at-risk and clear reproduction.'
    ],
    probeLadders: [
      { claim: 'The customer seemed happy on calls, then churned at renewal', probe: 'Diagnose missed leading indicators: champion left 4 months ago, executive buyer never saw ROI metrics, or core workflow adoption plateaued at 22%.' },
      { claim: 'A €250k enterprise client threatens churn unless we build custom feature X next week', probe: 'Test commercial + product judgment: unpack underlying workflow goal, offer configuration workaround, align AE/Product transparently without overpromising roadmap.' },
      { claim: 'I run QBRs showing feature updates and ticket stats', probe: 'Push from support reporter to strategic advisor: tie product usage directly to the CFO/VP’s revenue, cost, or compliance KPIs.' }
    ],
    redFlags: [
      'Acting as reactive Tier-1 ticket triage instead of proactively managing renewal risk 120–180 days out.',
      'Single-threading solely on one junior admin with zero Economic Buyer relationship.',
      'Promising custom engineering fixes to appease angry clients without Product alignment.'
    ],
    roundRubrics: {
      HR: 'Validate book-of-business size (€1M–€10M+ ARR), SMB scale vs Enterprise High-Touch CS/TAM motion, and direct NRR/GRR quota ownership.',
      Behavioral: 'Probe saving a red six-figure renewal after an outage or champion departure, navigating an upset CISO/VP, and driving organic multi-department expansion.',
      Technical: 'Drill Health Score architecture, Time-to-First-Value (TTFV) onboarding bottlenecks, QBR ROI framing, renewal forecasting, and technical escalation workflows.',
      'Live Coding': 'Live Churn Rescue & QBR Case: €300k account loses champion + adoption drops 40% 90 days before renewal—build 30/60/90 executive recovery plan.',
      'System Design': 'Design a segmented Customer Success & TAM operating model (Tech-Touch SMB + Mid-Market + Strategic Enterprise) driving GRR >92% and NRR >120%.',
      Negotiation: 'Calibrate CSM/TAM Base + NRR/Expansion variable split (typically 75/25 or 80/20), book size fairness, and senior leadership track.'
    },
    powerPhrases: [
      'Renewals are won or lost 180 days before contract end—if our only contact is a day-to-day admin and the original Economic Buyer hasn’t seen quantified ROI, that account is already at risk.',
      'When escalating a critical account issue to Product or Engineering, I bring quantified ARR impact, root workflow pain, and viable workarounds—never raw noise.'
    ]
  },

  people: {
    mandate: 'Accelerate company velocity by building high-signal structured hiring engines, equitable leveling & compensation architectures, and candid performance/retention cultures that scale without bureaucracy.',
    mentalModels: [
      'Structured Hiring Funnel Science: Track Pass-Through Conversion by Stage (App -> Screen -> Tech -> Onsite -> Offer -> Accept), Time-to-Fill, and Quality-of-Hire; kill unstructured "gut feel" interviews using calibrated rubrics.',
      'Leveling & Total Comp Architecture: Maintain transparent IC/Manager dual career ladders, market benchmark percentiles (base + equity/refreshers + geo tiers), and pay-equity audits preventing internal compression.',
      'Strategic HRBP Advisory: Diagnose org friction using data (regrettable attrition by manager/tenure, eNPS verbatims, ramp failure rates) and coach leaders through PIPs, reorgs, and tough exits lawfully.',
      'Candidate & Employer Brand Conversion: Close senior/exec passive talent through sharp role-mandate clarity, fast tight interview SLAs (<48h feedback), and authentic hiring-manager partnership.'
    ],
    probeLadders: [
      { claim: 'Engineering hiring is slow so we need more recruiters sourcing', probe: 'Diagnose funnel bottlenecks first: if Hiring Manager takes 6 days to review CVs or Onsite->Offer pass rate is 10%, adding sourcers floods a broken stage.' },
      { claim: 'A high-performing manager has 35% team attrition', probe: 'Probe data-backed executive intervention: exit interview patterns, skip-level listening, coaching vs role-change escalation with VP/CEO.' },
      { claim: 'We make bespoke counteroffers whenever someone gets another offer', probe: 'Challenge internal equity distortion and 12-month post-counteroffer attrition statistics vs proactive market benchmarking and career growth.' }
    ],
    redFlags: [
      'Policing policies rigidly without understanding business urgency, P&L trade-offs, or engineering craft realities.',
      'Running loose, uncalibrated interviews where interviewers ask random overlapping questions.',
      'Avoiding hard coaching on underperforming leaders or mishandling compliant termination/PIP documentation.'
    ],
    roundRubrics: {
      HR: 'Distinguish Technical Recruiting / Talent Lead vs Strategic HRBP / VP People scope, startup 20->200 vs enterprise scaling, and EU/US labor fluency.',
      Behavioral: 'Probe pushing back on a Hiring Manager’s biased or unrealistic unicorn spec, leading a compassionate RIF/reorg, and coaching a struggling leader.',
      Technical: 'Drill recruiting funnel diagnostics, structured rubric design, comp band/equity modeling, EU employment/works-council compliance, and attrition root-cause analysis.',
      'Live Coding': 'Live People/Hiring Case: Staff Eng req open 110 days with 45% offer decline rate OR regrettable attrition spiked 22% post-reorg—diagnose and build 60-day fix.',
      'System Design': 'Architect end-to-end Talent, Leveling, Onboarding & Performance Review Operating System for a 150-person hybrid/remote tech company.',
      Negotiation: 'Align Head of People / Principal Recruiter / Senior HRBP band, tooling/agency budget, executive seat access, and equity.'
    },
    powerPhrases: [
      'Before throwing more sourcing volume at an open Staff role, I audit stage-by-stage pass-through rates, feedback SLAs, and offer-decline reasons to fix the true bottleneck.',
      'Fair leveling and calibrated interview rubrics do two things simultaneously: they raise hiring quality and protect internal pay equity as the company scales.'
    ]
  }
};
