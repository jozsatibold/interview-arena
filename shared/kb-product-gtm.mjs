/**
 * Senior Domain Knowledge Bases: Product, Design, Growth & Delivery Leadership
 * Roles: pm, po, design, marketing, techlead, solutions
 */

export const KB_PRODUCT_GTM = {
  pm: {
    mandate: 'Discover high-conviction customer problems, sequence bets that move durable business metrics, and align Engineering, Design, and GTM around measurable outcomes rather than feature factories.',
    mentalModels: [
      'Opportunity Solution Trees (Teresa Torres): Tie Business Outcome -> Measurable Product Outcome -> Validated Customer Opportunities -> Multiple Candidate Solutions -> Fast Assumption Tests.',
      'North Star + Counter-Metric Pairing: Never ship a primary lift metric without a guardrail (e.g., Signup conversion vs Day-14 retention / Support ticket rate / Fraud loss).',
      'Experiment Rigor: Define Minimum Detectable Effect (MDE), sample size power, novelty effect decay, and B2B low-N qualitative + quasi-experimental substitutes.',
      'Prioritization Economics: RICE / Cost of Delay / Impact-vs-Eng-Weeks; account explicitly for maintenance tax and sales/support enablement cost.'
    ],
    probeLadders: [
      { claim: 'We will run an A/B test on the new onboarding', probe: 'Demand primary metric, guardrail metric, runtime under real B2B traffic volume, and what decision threshold triggers kill vs ship.' },
      { claim: 'Top enterprise client asked for this feature', probe: 'Probe separating custom one-off consulting bloat from repeatable ICP pain, and how to say no with commercial alternatives.' },
      { claim: 'Activation dropped 18%', probe: 'Force diagnostic segmentation BEFORE jumping to UX fixes: channel mix shift, cohort quality, latency/error telemetry, vs step-level friction.' }
    ],
    redFlags: [
      'Jumping straight into UI mockups or Jira tickets without stating who the user is, what job-to-be-done failed, or what metric shifts.',
      'Blindly copying competitor feature lists ("feature parity trap") with zero retention thesis.',
      'Treating engineering capacity as free or ignoring maintenance/compliance complexity.'
    ],
    roundRubrics: {
      HR: 'Validate product domain (B2B SaaS, PLG, Fintech, AI workflows), full lifecycle ownership (discovery->launch->iteration), and revenue/retention impact.',
      Behavioral: 'Probe saying no to CEO/Sales VP, killing a shipped feature that missed metrics, and rallying Eng through a difficult pivot.',
      Technical: 'Drill funnel telemetry, A/B power & guardrails, technical fluency (APIs/webhooks/latency trade-offs with Eng), and monetization/pricing tests.',
      'Live Coding': 'Live Product Case: diagnose funnel drop or prioritize 3 bets under a 6 engineer-week cap—demand clarifying questions, segment split, and explicit trade-offs.',
      'System Design': '0-to-1 Product & Ecosystem Strategy: define ICP wedge, monetization loop, adoption flywheels, and 3-horizon roadmap with defensible moat.',
      Negotiation: 'Calibrate IC Senior vs Group/Principal scope, P&L/metric ownership, equity refreshers, and level placement.'
    },
    powerPhrases: [
      'Before designing a solution, I segment whether the drop comes from acquisition mix shift, technical latency errors, or true workflow friction.',
      'Every feature carries ongoing cognitive and maintenance rent—saying yes to one mid-market ask means explicitly deferring retention work.'
    ]
  },

  po: {
    mandate: 'Maximize delivered squad value per sprint through outcome-focused Sprint Goals, sharp vertical backlog slicing, Cost-of-Delay sequencing, and fearless stakeholder scope protection.',
    mentalModels: [
      'Outcome Sprint Goals Over Ticket Lists: A sprint succeeds when customer/business capability X works end-to-end—not when 34 story points move across Jira columns.',
      'Thin Vertical Slicing (INVEST): Cut epics into usable end-to-end increments behind feature flags rather than horizontal "Week 1: DB schema, Week 2: API, Week 3: UI" delays.',
      'WSJF (Weighted Shortest Job First): Cost of Delay (User Value + Time Criticality + Risk Reduction) divided by Job Duration.',
      'Definition of Done Discipline: Automated tests, telemetry/alerts, accessibility, docs, and safe rollback criteria baked into every increment.'
    ],
    probeLadders: [
      { claim: 'We split stories by backend ticket and frontend ticket', probe: 'Push on integration delay risk at sprint day 9 and how thin vertical user-journey slicing delivers testable feedback earlier.' },
      { claim: 'Stakeholder demands an urgent mid-sprint addition', probe: 'Verify protection of team focus: enforce equal-effort swap-out, Sprint Goal impact assessment, or explicit Scrum Lead escalation.' },
      { claim: 'Backlog has 400 refinement tickets', probe: 'Challenge hoarding: show how 2-sprint ready-horizon + ruthless archival beats wasting Eng refinement hours on stale noise.' }
    ],
    redFlags: [
      'Acting as a passive transcriptionist taking orders from Sales/Execs into Jira.',
      'Judging squad performance by raw velocity points instead of production outcomes and escaped defect rates.',
      'Letting non-functional work (security, tech debt, telemetry) vanish until production incidents erupt.'
    ],
    roundRubrics: {
      HR: 'Clarify PO vs PM boundary experience, Scrum/Kanban scaling across multi-squad dependencies, and direct Eng/QA collaboration depth.',
      Behavioral: 'Probe pushing back on urgent exec requests mid-sprint, resolving cross-team dependency deadlocks, and rescuing a chronically slipping sprint.',
      Technical: 'Drill acceptance criteria (Given/When/Then edge cases), vertical slicing, WSJF Cost of Delay, Definition of Ready/Done, and flow metrics (cycle time, WIP).',
      'Live Coding': 'Live Backlog Conflict Case: handle 3 competing VP priorities + unresolved API dependency inside a 2-week sprint without burning down quality.',
      'System Design': 'Design multi-squad quarterly planning, dependency intake cadence, release train synchronization, and continuous discovery-to-delivery flow.',
      Negotiation: 'Align Senior PO / Lead PO band, dual-track PM career growth path, compensation expectations, and autonomy over prioritization.'
    },
    powerPhrases: [
      'I slice work vertically around testable user capabilities rather than horizontal technical layers so risk gets surfaced in week one, not integration week.',
      'Nothing enters mid-sprint for free—every urgent addition requires a conscious capacity swap so quality and predictability stay intact.'
    ]
  },

  design: {
    mandate: 'Solve root user comprehension and workflow friction with systemic clarity, Figma/Token engineering fluency, WCAG accessibility by default, and disciplined usability critique.',
    mentalModels: [
      'Design Tooling & Handoff Mastery: Figma Auto Layout, Component Properties/Variants, Semantic Variables (Primitive -> Alias -> Component mapped to Style Dictionary / CSS vars), Dev Mode inspect, and FigJam workshops.',
      'Prototyping & Research Toolchain: Interactive edge-case prototyping (Figma Variables, ProtoPie, Rive/Lottie micro-interactions), moderated/unmoderated validation (Maze, UserTesting), and Dovetail research tagging.',
      'WCAG 2.2 AA & Coded Sync: Verify contrast/focus order via Stark/Axe plugins, document keyboard/screen-reader annotations right in Figma Dev Mode, and review implemented states in Storybook.',
      'Problem-First Critique & Portfolio Rigor: Define edge/empty/loading/permission-denied/offline states BEFORE pixels; explain rejected iteration 1 compromises honestly.'
    ],
    probeLadders: [
      { claim: 'I built a Figma design system with components and sent Dev Mode links', probe: 'Drill Figma Variables vs Styles structure (multi-theme / responsive tokens), preventing instance detachment, syncing breaking token changes into Storybook/CI, and Adobe CC/Rive asset pipelines.' },
      { claim: 'We tested the new checkout with 6 users in Maze and refined it', probe: 'Challenge leading task phrasing, zero-context prototype bias, how qualitative findings were synthesized in Dovetail alongside funnel telemetry, and what specific drop-off step improved.' },
      { claim: 'I redesigned this screen to look cleaner', probe: 'Run a live App Critique push: diagnose mobile thumb ergonomics, inline error recovery timing, missing loading/empty states, and WCAG keyboard tab order.' }
    ],
    redFlags: [
      'Delivering pretty happy-path Figma frames ignoring Auto Layout resizing, truncation, empty/error states, and Dev Mode spacing tokens.',
      'Defensive ego attachment during live critique instead of reasoning cleanly from user cognitive load and metrics.',
      'Testing ONLY with colleagues or leading survey questions ("Do you like this cleaner layout?").'
    ],
    roundRubrics: {
      HR: 'Explore Figma Variables/Design System depth, tooling (FigJam, Maze, Dovetail, ProtoPie/Rive, Adobe CC, Storybook), portfolio scope, and PM/Eng triad partnership.',
      Behavioral: 'Probe defending accessibility/UX polish under tight release deadlines, scrapping a favorite Figma direction after Maze/usability failure, and mentoring designers.',
      Technical: 'Drill Figma Auto Layout/Variables/Dev Mode annotations, Style Dictionary token handoff, WCAG 2.2 AA (Stark/focus traps), ProtoPie/Rive constraints, and Storybook Design QA.',
      'Live Coding': 'Live App Critique & Whiteboard UX: tear down a broken flow across hierarchy, empty/error states, Figma responsiveness, and usability metrics.',
      'System Design': 'Architect a scalable multi-product Figma Design System + Token pipeline into Storybook serving 6 squads without slowing feature delivery.',
      Negotiation: 'Align Staff/Senior Product Designer band, Figma/research tooling budget (Maze/Dovetail), UX research autonomy, and comp package.'
    },
    powerPhrases: [
      'A flow isn’t handoff-ready in Figma Dev Mode until its Auto Layout responsiveness, Semantic Variable tokens, keyboard tab order, and empty/error states are explicitly specified.',
      'Instead of asking users in Maze or Dovetail whether they "like" a screen, I give realistic unguided tasks and triangulate hesitation spots with production funnel drop-off.'
    ]
  },

  marketing: {
    mandate: 'Engineer predictable demand and sharp category differentiation by pairing disciplined ICP positioning with full-funnel CAC/LTV economics and tight Sales/Product feedback loops.',
    mentalModels: [
      'April Dunford Positioning Stack: Competitive Alternatives -> Unique Capabilities -> Differentiated Customer Value -> Best-Fit ICP -> Winning Market Category.',
      'Full-Funnel Unit Economics: Blended vs Marginal Paid CAC, CAC Payback (<12m SMB / <18m Enterprise), PQL -> SQL -> Closed-Won velocity, Channel Saturation Curves.',
      'Tiered Launch Matrix: Match Go-To-Market blast (Tier 1 category launch vs Tier 2 ICP upgrade vs Tier 3 changelog note) to strategic ARR impact.',
      'Triangulated Attribution: Combine MTA software, self-reported dark-social attribution ("How did you hear about us?"), and holdout geo/incrementality tests.'
    ],
    probeLadders: [
      { claim: 'We will scale LinkedIn/Google Ads to double pipeline', probe: 'Push on marginal CAC inflation, audience ceiling in narrow B2B ICPs, and MQL vanity traps where Sales rejects 70% of leads.' },
      { claim: 'Our messaging highlights all 15 features', probe: 'Challenge dilution: force crisp 1-sentence wedge differentiation against what prospects actually use today (spreadsheets or incumbent).' },
      { claim: 'Attribution dashboard says Paid Search wins everything', probe: 'Expose last-click capture bias stealing credit from brand/podcast/community demand creation.' }
    ],
    redFlags: [
      'Optimizing vanity MQL volume or click CTR while Sales pipeline win-rate and payback deteriorate.',
      'Writing vague enterprise buzzwords ("AI-powered synergy platform") lacking concrete buyer pain or proof.',
      'Treating Product Marketing as post-hoc brochure polish instead of co-shaping ICP, pricing, and packaging.'
    ],
    roundRubrics: {
      HR: 'Distinguish Demand Gen / Growth vs Product Marketing (PMM) strengths, ACV/motion history (PLG vs Enterprise ABM), and pipeline quota accountability.',
      Behavioral: 'Probe killing a beloved failing campaign, resolving Sales complaints on lead quality, and launching into a skeptical competitive category.',
      Technical: 'Drill ICP segmentation, messaging hierarchy, pricing/packaging research (Van Westendorp / MaxDiff), PLG PQL loops, and incrementality measurement.',
      'Live Coding': 'Live GTM Case: Paid CAC jumped 55% while SQL conversion fell—reallocate budget, tighten ICP qualification, and rewrite core positioning wedge.',
      'System Design': 'Design full Demand + PMM + Lifecycle Engine bridging PLG self-serve trials into enterprise expansion pods.',
      Negotiation: 'Discuss pipeline-linked variable bonus vs base stability, headcount/agency budget ownership, and senior growth leadership leveling.'
    },
    powerPhrases: [
      'Leads aren’t pipeline: I calibrate marketing success on qualified Sales-accepted pipeline and payback months, not cheap top-of-funnel MQL volume.',
      'Sharp positioning picks a fight with the status quo alternative our best-fit buyers actually complain about, backed by concrete proof.'
    ]
  },

  techlead: {
    mandate: 'Unblock multi-engineer delivery with sound evolutionary architecture, clear RFC/ADR alignment, production reliability ownership, and active force-multiplier mentorship.',
    mentalModels: [
      'Evolutionary Boundaries (Reversible vs One-Way Doors): Invest heavy RFC rigor in high-cost-to-reverse choices (data ownership, public contracts, auth boundaries) and move fast on two-way doors.',
      'Technical Leverage: Force-multiply via shared abstractions ONLY after 3+ real use cases prove the invariant—avoid premature DRY coupling across unrelated domains.',
      'Operational Readiness Checklist: SLOs/SLIs, structured trace correlation, idempotent retries, feature-flag kill switches, and rollback plan before launch.',
      'Disagree & Commit Facilitation: Timebox architecture debates around explicit constraints & failure budgets, then document the winning rationale clearly in an ADR.'
    ],
    probeLadders: [
      { claim: 'We should split this service for cleanliness', probe: 'Challenge distributed systems tax: network partial failures, schema versioning, dual deploys, and tracing overhead vs modular in-process boundary.' },
      { claim: 'Two senior devs keep arguing over patterns', probe: 'Test technical mediation: drive toward objective fitness criteria (latency, migration cost, team cognitive load) and crisp decision deadlines.' },
      { claim: 'Our code reviews take 3 days', probe: 'Diagnose giant 1,200-line PR batches, bikeshedding vs automated lint/format rules, and asynchronous review SLAs.' }
    ],
    redFlags: [
      'Architecting resume-driven complexity (Kafka + Kubernetes + GraphQL federation) for a 5-person SaaS MVP.',
      'Doing all critical tickets alone instead of elevating mid-level engineers through pairing and design reviews.',
      'Ignoring product timelines and customer urgency while chasing theoretical purity.'
    ],
    roundRubrics: {
      HR: 'Clarify hands-on coding percentage (typically 50–70% Tech Lead vs 20–30% Staff), cross-squad scope, and mentoring impact.',
      Behavioral: 'Probe owning a major production outage end-to-end, saying no to a premature rewrite, and persuading PM to fund critical reliability work.',
      Technical: 'Drill contract design, modularity vs distributed coupling, performance/p99 bottleneck profiling, zero-downtime migrations, and PR/RFC standards.',
      'Live Coding': 'Live RFC / Debug Triage: walk through breaking tight coupling or isolating cascading latency under live traffic constraints.',
      'System Design': 'Design multi-squad extensible architecture with clear domain boundaries, async outbox reliability, and observability at scale.',
      Negotiation: 'Calibrate Staff vs Lead title scope, technical ladder parity with EM track, comp band, and architecture governance authority.'
    },
    powerPhrases: [
      'I separate one-way doors like public APIs and schema ownership from reversible implementation details so we move fast without painting ourselves into a corner.',
      'Code is cheap—operational surface area is expensive. Unless team boundaries or independent scaling demand a network hop, keep clean modular boundaries in-process.'
    ]
  },

  solutions: {
    mandate: 'Bridge complex customer architectures and commercial urgency—diagnosing true enterprise blockers early, scoping airtight PoCs, and winning CISO/Architect trust cleanly.',
    mentalModels: [
      'Technical Discovery Before Demo: Map customer Identity (Okta/Entra SSO/SCIM), Data Residency/VPC constraints, Legacy Integration Topology, and Critical Success Event before clicking slides.',
      'Mutual Action & PoC Exit Criteria: Never start an open-ended PoC—lock 3–4 measurable technical pass/fail criteria, buyer stakeholders, and a firm end date.',
      'Trust & Security Objection Mastery: Know SOC2 Type II, ISO27001, GDPR sub-processors, RBAC/least privilege, TLS/KMS encryption, and signed webhook verification cold.',
      'Roadmap Honesty vs Workarounds: Distinguish committed GA dates from unscheduled wishes cleanly while offering viable intermediate integration patterns.'
    ],
    probeLadders: [
      { claim: 'Prospect asked for an unlisted API feature, so I promised Engineering would build it', probe: 'Spot scope-creep disaster: uncover WHY the prospect wants it, explore webhook/ETL workarounds, and negotiate commercial gating.' },
      { claim: 'PoC dragged on for 90 days', probe: 'Diagnose missing Champion access, unverified customer sandbox readiness, or undefined pass/fail technical criteria.' },
      { claim: 'CISO blocked deal over data privacy', probe: 'Walk through concrete architectural isolation (BYOK, EU region pinning, PII tokenization, audit logs) rather than vague reassurance.' }
    ],
    redFlags: [
      'Running generic click-through feature demos ignoring the customer’s stated pain and architecture.',
      'Overpromising unbuilt product capabilities under AE pressure.',
      'Getting lost in deep syntax trivia instead of linking integration choices to business ROI and go-live risk.'
    ],
    roundRubrics: {
      HR: 'Validate customer-facing SE/SA ratio with AEs, ACV complexity, enterprise InfoSec clearance wins, and hands-on prototyping stack.',
      Behavioral: 'Probe saving a threatened $250k+ PoC after integration failure, pushing back ethically against an AE stretching product truth, and executive demo recovery.',
      Technical: 'Drill SAML/OIDC SSO + SCIM flows, idempotent webhook ingestion, rate limiting/backpressure, multi-tenant data isolation, and latency sizing.',
      'Live Coding': 'Live Architecture Discovery & PoC Case: Enterprise bank demands EU residency, Okta SCIM, and ERP sync in 3 weeks—scope feasible MVP architecture.',
      'System Design': 'Design a resilient enterprise integration blueprint (SSO, Async Webhook Ingestion, Audit Trail, Disaster Recovery) meeting strict SLA/compliance.',
      Negotiation: 'Verify SE Base/Variable split (typically 70/30 or 75/25), team vs quota-pooled commission, demo budget, and Staff SA trajectory.'
    },
    powerPhrases: [
      'Every PoC needs mutually signed exit criteria before we spin up a tenant—otherwise a technical trial turns into unpaid consulting.',
      'When an enterprise CISO pushes back, I win trust by mapping exact trust boundaries, data flows, and least-privilege controls—not sales slides.'
    ]
  }
};
