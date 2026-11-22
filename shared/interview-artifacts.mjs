/**
 * Shared Interview "Screen Share" Role-Aware Artifacts (`EXP-07` + Universal Tech Roles)
 * Adapts shared briefs across IC Engineering, Lead/EM, Product/Design, Data/Security, and Executive C-Suite.
 */

import { getRoleCategory } from './role-archetypes.mjs';

export const SCREEN_SHARE_TOPICS = new Set(['Technical', 'Live Coding', 'System Design']);

export const INTERVIEW_ARTIFACTS = [
  // --- PRODUCT MANAGER / PRODUCT OWNER ---
  {
    id: 'pm-activation-funnel',
    roles: ['pm'],
    categories: ['product'],
    topics: ['Technical', 'Live Coding'],
    kind: 'Product Analytics · Q2 Drop',
    title: 'Self-Serve Activation Funnel (-18% Post-Signup Regression)',
    language: 'text',
    promptHint: 'Diagnose where drop-off happens, propose instrumentation & prioritization without jumping blindly to features.',
    lines: [
      'Weekly Funnel (B2B Self-Serve Trial, n = 14,200 signups):',
      '  1. Email Verified -> Workspace Created : 88% (unchanged)',
      '  2. Connect First Data Source           : 41% (down from 59% in Q1)',
      '  3. Invite 1+ Teammate within 48h       : 24% (strongest retention predictor)',
      '  4. Day-14 Paid Conversion              : 7.4% (down from 10.2%)',
      '',
      'Open Engineering Squad Capacity: 6 engineer-weeks this sprint.',
      'Conflicting Asks: Sales wants SSO; CS wants bulk CSV import; Growth wants 2-step OAuth template.'
    ]
  },
  {
    id: 'po-sprint-scope',
    roles: ['po'],
    categories: ['product'],
    topics: ['Live Coding', 'Technical', 'System Design'],
    kind: 'Backlog & Sprint Case',
    title: 'Q3 Sprint Commitment Conflict & Epic Splitting Matrix',
    language: 'text',
    promptHint: 'Slice scope cleanly, defend what stays vs defers, and define crisp Acceptance Criteria.',
    lines: [
      'Epic: Enterprise Invoice Exports + Tax Compliance (Estimated 21 Story Points; Capacity = 13 pts):',
      '  [Story A · 5 pts] PDF invoice export for EU VAT reverse-charge accounts (blocked on CFO sign-off)',
      '  [Story B · 3 pts] CSV ledger export matching existing API schema (zero blockers)',
      '  [Story C · 5 pts] Automated Stripe webhook retry alerts in merchant dashboard',
      '  [Urgent Prod Bug] 2% of multi-currency refunds fail rounding check on JPY',
      'Goal: Protect sprint commitment while shipping highest immediate customer value.'
    ]
  },
  {
    id: 'pm-strategy-pricing',
    roles: ['pm'],
    categories: ['product'],
    topics: ['System Design', 'Technical'],
    kind: 'Product Strategy Case',
    title: '0-to-1 AI Copilot Packaging & Monetization Brief',
    language: 'text',
    promptHint: 'Choose packaging metric (seat vs usage vs outcome), free-tier limits, and gross margin guardrails.',
    lines: [
      'Current Pricing: Flat €29/seat/month across SMB and Mid-Market (78% gross margin).',
      'New AI Copilot Feature: LLM inference costs ~$0.09 per workflow run; power users run 400+/mo.',
      'Risk 1: Flat-rate unlimited usage turns top 10% heavy users margin-negative.',
      'Risk 2: Strict per-token billing kills trial adoption and makes enterprise budgeting unpredictable.'
    ]
  },

  // --- EXECUTIVE C-SUITE (CEO / COO / CTO) ---
  {
    id: 'ceo-board-runway',
    roles: ['ceo'],
    categories: ['executive'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Series B Board Snapshot',
    title: 'NRR Dip, Burn Multiple & Enterprise Pivot Decision',
    language: 'text',
    promptHint: 'Explain root cause candidly to the board, align GTM & Product investment, and defend 24-month runway.',
    lines: [
      'Q3 Board Metrics ($18M ARR, 19 months runway remaining):',
      '  - New Logo ARR: +38% YoY (Enterprise ACV growing from $28k -> $64k)',
      '  - Net Dollar Retention (NRR): dropped from 118% -> 104% (SMB logo churn at 4.1%/mo)',
      '  - Burn Multiple: 1.9x (Board target <= 1.3x before Series C)',
      'Decision on Table: Cut SMB paid acquisition by 60% and double Enterprise CS + SOC2 roadmap?'
    ]
  },
  {
    id: 'coo-ops-sla',
    roles: ['coo'],
    categories: ['executive'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Operations & SLA Audit',
    title: '3x Onboarding Surge — SLA Breach vs Gross Margin Recovery',
    language: 'text',
    promptHint: 'Redesign onboarding workflow, segment self-serve vs white-glove tiers, and align RevOps incentives.',
    lines: [
      'Volume Spike: Monthly enterprise activations jumped 45 -> 130 merchants in 90 days.',
      '  - Time-to-Value (TTV): slipped from 6 days -> 23 days (SLA target: 10 days)',
      '  - Onboarding team utilization: 124%, overtime + attrition rising',
      '  - Customer Success spends 62% of hours manually fixing messy CSV imports & KYB forms.'
    ]
  },
  {
    id: 'cto-finops-org',
    roles: ['cto'],
    categories: ['executive'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'CTO Exec Review',
    title: 'Cloud COGS Spike & Cross-Squad Delivery Slowdown',
    language: 'text',
    promptHint: 'Balance FinOps cost-cutting, platform vs stream-aligned Team Topologies, and DORA metrics.',
    lines: [
      'Eng Org: 95 engineers across 11 squads; AWS/Snowflake bill grew +52% while ARR grew +28%.',
      '  - Lead Time for Changes: slowed from 1.2 days -> 6.5 days due to shared QA staging queue',
      '  - 41% of cloud spend sits in over-provisioned multi-AZ staging & unindexed analytics scans',
      'Board Ask: Improve gross margin by 6 points in 2 quarters WITHOUT stalling Enterprise launches.'
    ]
  },

  // --- TECH LEAD / ENGINEERING MANAGER ---
  {
    id: 'lead-rfc-boundaries',
    roles: ['techlead'],
    categories: ['lead'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Staff RFC · Architecture & Org',
    title: 'Decomposing Shared Checkout Monolith Across 4 Squads',
    language: 'text',
    promptHint: 'Evaluate strangler boundaries, release independence, shared schema traps, and rollout risk.',
    lines: [
      'Problem: 4 squads deploy through 1 shared repository; 3 broken builds/week block every release.',
      'Proposal A: Big-bang rewrite into 8 microservices over 2 quarters.',
      'Proposal B: Modular monolith boundaries + strict contract tests + independent deployable BFF first.',
      'Open Conflict: Squad Leads split 2-2; PM needs continuous weekly feature releases during migration.'
    ]
  },

  // --- DESIGN / UX ---
  {
    id: 'design-checkout-wcag',
    categories: ['design'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Figma Audit & UX Critique',
    title: 'Mobile KYB Verification — Drop-Off, Figma Tokens & WCAG AA Remediation',
    language: 'text',
    promptHint: 'Probe Figma Auto Layout/Variables tokens, Maze/Dovetail findings, error/empty states & Stark WCAG AA.',
    lines: [
      'Figma Handoff & Maze Test Findings (n=8 unmoderated sessions, tagged in Dovetail):',
      '  - 14 mandatory fields in one non-responsive frame; Dev Mode lacks spacing/semantic variables.',
      '  - Validation fires only on Submit, scrolling blindly back to error #1.',
      '  - Placeholder text doubles as labels (#94a3b8 contrast fails Stark WCAG AA 4.5:1).',
      '  - Camera upload fails silently on slow 3G with zero ProtoPie/loading/offline draft state.'
    ]
  },

  // --- DATA / ML ---
  {
    id: 'data-pipeline-drift',
    categories: ['data'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Analytics & MLOps Brief',
    title: 'Warehouse Schema Drift & A/B Sample Ratio Mismatch',
    language: 'text',
    promptHint: 'Diagnose silent pipeline corruption, idempotent backfills, and experiment trust guardrails.',
    lines: [
      'Alert: Revenue attribution dashboard jumped +22% overnight while Stripe payouts stayed flat.',
      'Root Clues:',
      '  1. Upstream service began emitting duplicate `checkout.completed` events on webhook retry.',
      '  2. Incremental dbt model appends on `updated_at` without deduplicating by `event_id`.',
      '  3. Experiment variant B sees 54/46 traffic split (SRM p < 0.001) on iOS Safari.'
    ]
  },

  // --- SECURITY / APPSEC ---
  {
    id: 'sec-oauth-threat',
    categories: ['security'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'AppSec Threat Model',
    title: 'Multi-Tenant Webhook Fetcher & OAuth Token Scoping Review',
    language: 'text',
    promptHint: 'Identify SSRF, tenant IDOR, webhook replay/HMAC validation, and least-privilege gaps.',
    lines: [
      'Feature Spec: Tenants configure custom webhook URLs for invoice status callbacks.',
      'Draft Implementation:',
      '  app.post("/api/test-hook", async (req) => {',
      '    const { tenantId, targetUrl } = req.body;',
      '    const secret = await db.getTenantSecret(tenantId);',
      '    return fetch(targetUrl, { method: "POST", body: JSON.stringify({ ok: true }) });',
      '  });'
    ]
  },

  // --- IC SOFTWARE ENGINEERING (DEFAULT) ---
  {
    id: 'ts-checkout-race',
    categories: ['engineering', 'lead'],
    topics: ['Technical', 'Live Coding'],
    kind: 'Code Review · PR #418',
    title: 'Checkout Submit Hook — Duplicate Charge & Cleanup Bug',
    language: 'typescript',
    promptHint: 'Review state updates, abort safety, and idempotency around the async submit.',
    lines: [
      'export function useCheckoutSubmit(cartId: string) {',
      '  const [submitting, setSubmitting] = useState(false);',
      '  const [receipt, setReceipt] = useState<Receipt | null>(null);',
      '',
      '  const submitOrder = async () => {',
      '    setSubmitting(true);',
      '    const res = await fetch(`/api/checkout/${cartId}`, {',
      '      method: "POST",',
      '      body: JSON.stringify({ ts: Date.now() })',
      '    });',
      '    const data = await res.json();',
      '    setReceipt(data);',
      '    setSubmitting(false);',
      '  };',
      '',
      '  return { submitting, receipt, submitOrder };',
      '}'
    ]
  },
  {
    id: 'widget-bundle-leak',
    categories: ['engineering'],
    topics: ['Technical'],
    kind: 'Performance Trace · Production',
    title: '12KB Third-Party Embed — Memory & Bundle Regression',
    language: 'typescript',
    promptHint: 'Spot global listener leaks, DOM churn, and bundle bloat risks.',
    lines: [
      'import { cloneDeep } from "lodash";',
      '',
      'export function mountPromoBanner(root: HTMLElement, cfg: Config) {',
      '  const localCfg = cloneDeep(cfg);',
      '  const render = () => {',
      '    root.innerHTML = `<div class="promo">${localCfg.title}</div>`;',
      '  };',
      '  window.addEventListener("scroll", render);',
      '  window.addEventListener("resize", render);',
      '  render();',
      '}'
    ]
  },
  {
    id: 'lc-ttl-cache',
    categories: ['engineering'],
    topics: ['Live Coding', 'Technical'],
    kind: 'Live Coding Brief',
    title: 'Bounded LRU + TTL Cache (`get`, `set`, `evict`)',
    language: 'typescript',
    promptHint: 'Discuss O(1) operations, expired-key handling, and memory bounds.',
    lines: [
      'class TtlLruCache<K, V> {',
      '  constructor(private maxEntries: number, private defaultTtlMs: number) {}',
      '',
      '  get(key: K): V | undefined {',
      '    // TODO: check expiration, refresh recency, return undefined if stale',
      '  }',
      '',
      '  set(key: K, value: V, ttlMs = this.defaultTtlMs): void {',
      '    // TODO: overwrite cleanly, evict LRU entry if over maxEntries',
      '  }',
      '}'
    ]
  },
  {
    id: 'sd-rate-limiter',
    categories: ['engineering', 'lead'],
    topics: ['System Design', 'Technical'],
    kind: 'Architecture Brief',
    title: 'Multi-Tenant Public API Rate Limiter (50k RPS)',
    language: 'text',
    promptHint: 'Explore distributed counters, Redis failure fallback, and noisy-neighbor isolation.',
    lines: [
      'Requirements:',
      '1. Enforce per-tenant burst + sustained quotas across 12 stateless edge regions.',
      '2. Target p99 overhead < 3 ms on the hot API Gateway path.',
      '3. Fail-open vs fail-closed behavior if Redis cluster experiences partial partition.',
      '4. Emit real-time 429 headers + audit metrics without blocking request threads.'
    ]
  },

  // --- CFO / CRO / GROWTH / SOLUTIONS / INFRA / QA / MOBILE ---
  {
    id: 'cfo-rule40-cohort',
    roles: ['cfo'],
    categories: ['executive'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'CFO Unit Economics Brief',
    title: 'Q3 Cohort Bridge: 115% NRR Masking 83% GRR & AI COGS Spike',
    language: 'text',
    promptHint: 'Diagnose Burn Multiple (2.4x), Gross vs Net retention divergence, and margin recovery levers.',
    lines: [
      'Financial Snapshot: $24M ARR | Burn Multiple: 2.4x | Gross Margin dropped 79% -> 69%',
      'Retention Breakdown: NRR = 115% (top-decile upsell), GRR = 83% (SMB logo churn +25% YoY)',
      'Drivers:',
      '  - Uncapped LLM inference costs eroding SMB tier contribution margin (-14 pts)',
      '  - Annual upfront collections dropped from 78% to 52% under quarter-end discounting'
    ]
  },
  {
    id: 'cro-pipeline-meddpicc',
    roles: ['cro'],
    categories: ['gtm', 'executive'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Revenue Forecast Clinic',
    title: 'Q4 Pipeline Audit: 2.4x Coverage, 38% Quota Attainment & Slippage',
    language: 'text',
    promptHint: 'Audit MEDDPICC gaps, rep distribution vs hero deals, and Paper Process close bottlenecks.',
    lines: [
      'Q4 Target: $4.2M Net New ARR | Current Commit: $3.1M (62% tied to 3 Enterprise deals)',
      'Funnel Health: Stage 2+ Pipeline = 2.4x target | Avg Discount escalated to 28% at end-of-qtr',
      'Blocked Top Deal ($950k ACV): "Champion verbally agreed; CFO not met yet; InfoSec review not started"'
    ]
  },
  {
    id: 'mktg-plg-positioning',
    roles: ['marketing'],
    categories: ['gtm'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'GTM & Growth Audit',
    title: 'Paid CAC +55% Spike & Trial-to-SQL Drop After Broad Enterprise Pivot',
    language: 'text',
    promptHint: 'Re-anchor ICP wedge positioning, cut wasted MQL spend, and test incrementality.',
    lines: [
      'Last 2 Quarters: Paid Search CAC $1,400 -> $2,170 | MQLs +40% but Sales-Accepted SQLs -19%',
      'Trial Telemetry: Self-serve signups abandon during Team Workspace setup (only 12% hit Aha! state)',
      'Prompt: Reallocate €120k/mo demand budget & sharpen ICP positioning wedge.'
    ]
  },
  {
    id: 'sol-enterprise-poc',
    roles: ['solutions'],
    categories: ['solutions'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Enterprise PoC Scoping',
    title: 'Tier-1 Bank 3-Week PoC: Okta SCIM, EU Residency & Custom Webhook Sync',
    language: 'text',
    promptHint: 'Lock mutual exit criteria, address CISO InfoSec blockers, and block unpaid scope creep.',
    lines: [
      'Account: $280k ARR Banking Prospect | Hard Go-Live Deadline: 60 days',
      'Technical Constraints: Okta OIDC + SCIM group sync, EU Frankfurt data pinning, encrypted webhooks',
      'Friction: AE promised "custom SOAP legacy adapter built in Sprint 1" before Engineering sign-off.'
    ]
  },
  {
    id: 'em-delivery-burnout',
    roles: ['em'],
    categories: ['executive', 'engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'EM People & Delivery Case',
    title: 'Senior Tech Lead Burnout Risk + Mid-Sprint Scope Injection Conflict',
    language: 'text',
    promptHint: 'Balance people retention, WIP caps, and transparent PM-Eng trade-off negotiation.',
    lines: [
      'Squad Pulse: Deployment CFR climbed from 3% to 18%; PR cycle time hit 4.2 days',
      'Trigger: Staff/Lead IC privately flagged burnout from 4 consecutive urgent PM hotfixes',
      'Ask: Stabilize sprint predictability, coach Lead on delegation, and reset PM intake rules.'
    ]
  },
  {
    id: 'devops-k8s-outage',
    roles: ['devops'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'SRE Incident Brief',
    title: 'Sev-1 Cascade: Postgres Micro-Blip Triggered Full K8s Pod Restart Storm',
    language: 'text',
    promptHint: 'Spot broken liveness probe wiring, missing PDB/backpressure, and safe migration steps.',
    lines: [
      '14:02 UTC: RDS CPU briefly spiked for 4s during analytics batch query.',
      '14:03 UTC: API `/healthz` (checking SELECT 1 on RDS) returned 500 -> Kubelet killed all 48 API pods.',
      '14:04 UTC: Cold-start burst + thundering herd retries locked RDS connections completely.'
    ]
  },
  {
    id: 'qa-flaky-ci-pyramid',
    roles: ['qa'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Quality Engineering Audit',
    title: 'CI Bottleneck: 38-Minute Playwright Suite With 24% Flake Rate Blocking Deploys',
    language: 'text',
    promptHint: 'Diagnose shared state/sleep antipatterns and shift suite toward contract + deterministic E2E.',
    lines: [
      'Current State: 190 sequential Playwright specs | 8 explicit `waitForTimeout(3000)` hacks',
      'Failure Mode: Shared staging merchant user mutated simultaneously by parallel shards',
      'Goal: Drop PR gate under 8 minutes with <0.5% deterministic flake rate.'
    ]
  },
  {
    id: 'backend-idempotency-outbox',
    roles: ['java', 'dotnet', 'python', 'php'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Backend Concurrency Review',
    title: 'Order Settlement Handler: Held DB Transaction Across External Gateway Call',
    language: 'text',
    promptHint: 'Spot connection-pool exhaustion, dual-write race, and Transactional Outbox fix.',
    lines: [
      'Transactional Handler:',
      '  1. BEGIN DB TRANSACTION -> UPDATE orders SET status = "CHARGING" FOR UPDATE',
      '  2. CALL Stripe/Adyen HTTP API (p99 = 8s during provider brownout)',
      '  3. PUBLISH Kafka `OrderPaid` event -> COMMIT DB TRANSACTION'
    ]
  },
  {
    id: 'rn-cordova-bridge',
    roles: ['mobile'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Hybrid / Cross-Platform Case',
    title: 'Migrating Legacy Cordova WKWebView Bridge & React Native Scroll Jitter',
    language: 'text',
    promptHint: 'Diagnose localStorage eviction, CORS quirks, legacy RN JSON bridge choke & JSI/Capacitor fix.',
    lines: [
      'Stack: Hybrid mobile fleet (Cordova WKWebView + React Native modules)',
      'Production Issues:',
      '  1. iOS users lose auth session after low-disk WebView cleanup (`localStorage`).',
      '  2. Gesture carousel drops to 24 FPS over async RN bridge serialization.'
    ]
  },
  {
    id: 'mobile-jank-offline',
    roles: ['flutter', 'mobile'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Mobile Architecture Brief',
    title: '120Hz Feed Scroll Jank & Offline Queue Token Refresh Race on Android',
    language: 'text',
    promptHint: 'Isolate heavy JSON/image work off UI thread and serialize offline sync + JWT refresh.',
    lines: [
      'Symptom: Frame times hit 42ms on mid-tier Android during catalog scroll with nested animations',
      'Bug #2: After tunnel offline reconnect, 5 queued mutations fire parallel 401 token refreshes',
      'Prompt: Diagnose UI/Raster/JSI bottlenecks and design mutex-protected offline SQLite sync.'
    ]
  },
  {
    id: 'go-context-leak',
    roles: ['go'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Go Concurrency Review',
    title: 'Goroutine Memory Leak & Default http.Client Hung Fan-Out',
    language: 'go',
    promptHint: 'Spot leaked goroutines on context cancel, missing HTTP timeouts, and errgroup limits.',
    lines: [
      'func fetchRates(ctx context.Context, banks []string) []Rate {',
      '  ch := make(chan Rate)',
      '  for _, b := range banks {',
      '    go func(id string) { ch <- callBankHttpDefaultClient(id) }(b)',
      '  }',
      '  return collectFirstN(ctx, ch, 2) // Wait: what happens to slow goroutines?',
      '}'
    ]
  },
  {
    id: 'rust-tokio-mutex',
    roles: ['rust'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Rust Async & Ownership Review',
    title: 'Tokio Task Deadlock: Sync MutexGuard Held Across `.await` Boundary',
    language: 'rust',
    promptHint: 'Identify `!Send` / deadlock risk across `.await`, blocking calls, and `.unwrap()` panics.',
    lines: [
      'async fn credit_wallet(state: Arc<std::sync::Mutex<Ledger>>, id: &str, amt: u64) -> u64 {',
      '  let mut guard = state.lock().unwrap();',
      '  let bonus = fetch_promo_async(id).await.unwrap();',
      '  guard.add(id, amt + bonus)',
      '}'
    ]
  },
  {
    id: 'ios-actor-reentrancy',
    roles: ['ios'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Swift & Objective-C Review',
    title: 'Swift Actor Reentrancy Double-Refresh & Obj-C Block Retain Cycle',
    language: 'swift',
    promptHint: 'Catch duplicate refresh calls across actor await points and Obj-C block strong capture.',
    lines: [
      'actor AuthSession {',
      '  private var token: String?',
      '  func validToken() async throws -> String {',
      '    if let t = token, !isExpired(t) { return t }',
      '    let fresh = try await api.refreshToken() // Actor reentrancy trap when 4 views call!',
      '    self.token = fresh; return fresh',
      '  }',
      '}'
    ]
  },
  {
    id: 'android-compose-anr',
    roles: ['android'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Android Kotlin / Compose Review',
    title: 'Play Vitals ANR Spike & Unstable Jetpack Compose Recomposition Storm',
    language: 'kotlin',
    promptHint: 'Catch GlobalScope leaks, unstable collections in LazyColumn, and OS process-death recovery.',
    lines: [
      'class CheckoutViewModel : ViewModel() {',
      '  val items = mutableStateListOf<CartItem>()',
      '  fun syncCart() { GlobalScope.launch(Dispatchers.Main) { saveToDiskSync(items) } }',
      '}'
    ]
  },
  {
    id: 'cpp-raii-falsesharing',
    roles: ['cpp'],
    categories: ['engineering'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'C++20 Systems & Perf Review',
    title: 'Dangling `string_view` Lifetime & Multi-Core Atomic False Sharing',
    language: 'cpp',
    promptHint: 'Spot temporary dangling views, 64-byte cache-line ping-pong, and RAII / sanitizer fixes.',
    lines: [
      'struct ThreadCounters { std::atomic<uint64_t> rx{0}; std::atomic<uint64_t> tx{0}; };',
      'std::string_view buildHeader(std::string prefix) {',
      '  std::string full = prefix + "-v2";',
      '  return full; // UB: dangling reference to destroyed stack string!',
      '}'
    ]
  },
  {
    id: 'tpm-cross-org-slip',
    roles: ['tpm'],
    categories: ['tpm'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Program Risk & Critical Path',
    title: '6-Squad Regulated Launch: 3-Week API & InfoSec Queue Slippage',
    language: 'text',
    promptHint: 'Re-baseline critical path, define Go/No-Go gates, and frame BLUF VP escalation options.',
    lines: [
      'Launch Date: Nov 15 (Board commitment) | Status reported "Green" for 5 weeks until today.',
      'Hidden Blockers Found:',
      '  1. Payments Core API slipped 3 weeks; Mobile & Web squads blocked on real schema.',
      '  2. InfoSec pentest queue has 18-day backlog (never booked in kickoff).'
    ]
  },
  {
    id: 'csm-enterprise-churn',
    roles: ['csm'],
    categories: ['csm'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Enterprise Renewal Rescue',
    title: '€300k ARR Account: Champion Departed & Adoption Fell -40% (90d Out)',
    language: 'text',
    promptHint: 'Build multi-threaded exec recovery, ROI-anchored EBR, and block unapproved custom promises.',
    lines: [
      'Account: Apex Retail EU (€300k ARR, renews in 90 days) | Health Score: RED (34/100)',
      'Signals: Original VP Champion left 60 days ago; active weekly seats fell 68% -> 28%.',
      'Friction: New Director cites 3 unresolved P2 bugs and demands custom SAP connector before signing.'
    ]
  },
  {
    id: 'people-hiring-leveling',
    roles: ['people'],
    categories: ['people'],
    topics: ['Technical', 'Live Coding', 'System Design'],
    kind: 'Talent & People Ops Audit',
    title: '110-Day Open Staff Eng Req, 45% Offer Decline & Manager Churn Spike',
    language: 'text',
    promptHint: 'Audit funnel pass-through bottlenecks, feedback SLAs, pay equity bands, and leader coaching.',
    lines: [
      'Funnel Audit: 420 sourced -> 68 screens -> 29 tech -> 11 onsites -> 6 offers -> 3 accepts (45% decline).',
      'Bottlenecks: Avg HM CV review = 6.5 days; 4 interviewers ask overlapping uncalibrated questions.',
      'HRBP Alert: Regrettable attrition hit 32% inside one high-output Eng Manager’s org.'
    ]
  }
];

export function isScreenShareAllowedTopic(topic = '') {
  return SCREEN_SHARE_TOPICS.has(String(topic || '').trim());
}

export function getArtifactsForTopic(topic = 'Technical', archKey = 'general') {
  const t = String(topic || '').trim();
  if (!isScreenShareAllowedTopic(t)) return [];
  const roleSpecific = INTERVIEW_ARTIFACTS.filter(
    (a) => a.topics.includes(t) && Array.isArray(a.roles) && a.roles.includes(archKey)
  );
  const cat = getRoleCategory(archKey);
  const catMatched = INTERVIEW_ARTIFACTS.filter(
    (a) => a.topics.includes(t) && (a.categories || ['engineering']).includes(cat) && !roleSpecific.includes(a)
  );
  const combined = [...roleSpecific, ...catMatched];
  if (combined.length > 0) return combined;
  return INTERVIEW_ARTIFACTS.filter((a) => a.topics.includes(t) && (a.categories || []).includes('engineering'));
}

export function findArtifactById(id) {
  return INTERVIEW_ARTIFACTS.find((a) => a.id === id) || null;
}
