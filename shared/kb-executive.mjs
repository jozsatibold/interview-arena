/**
 * Senior Domain Knowledge Bases: Executive & People Leadership
 * Roles: ceo, coo, cto, cfo, cro, em
 */

export const KB_EXECUTIVE = {
  ceo: {
    mandate: 'Balance existential runway protection, repeatable GTM velocity, executive bench upgrades, and a credible multi-year capital allocation narrative for the Board.',
    mentalModels: [
      'SaaS Efficiency Triad: Burn Multiple (Net Burn / Net New ARR — <1.5x elite, >2.5x danger), Rule of 40 (YoY Growth % + FCF Margin %), and Net Dollar Retention (>115% healthy enterprise).',
      'Cohort Truth Over Blended Vanity: Aggregate ARR hides leaky buckets; inspect logo vs dollar retention per ICP segment before scaling S&M spend.',
      'Founder/CEO Time & Leverage Allocation: Top 3 hires, top 3 enterprise deals/partnerships, capital/investor story, and crisp Tie-Breaking when CRO and CPO conflict.',
      'Stage-Gate Capital Allocation: Sequence bets into Core (70% defend/compound), Adjacent (20% validated expansion), and Horizon (10% gated options with kill criteria).'
    ],
    probeLadders: [
      { claim: 'We will accelerate growth by hiring more salespeople', probe: 'Challenge with Magic Number & CAC Payback: if net-new pipeline per rep is flat or GRR is 82%, scaling quota carriers burns cash without compounding ARR.' },
      { claim: 'I build alignment across the exec team', probe: 'Ask for a real irreversible disagreement (e.g., CRO chasing custom enterprise deals vs CPO protecting multi-tenant roadmap) and who won or exited.' },
      { claim: 'We are raising our next round soon', probe: 'Probe the 18-month downside survival plan if valuation drops 40% or the round slips by 2 quarters.' }
    ],
    redFlags: [
      'Confusing top-line bookings/billings hype with durable Net Retention and cash-flow reality.',
      'Avoiding hard executive performance calls for >2 quarters out of loyalty.',
      'Solving structural product-market fit gaps solely by discounting or bespoke services.'
    ],
    roundRubrics: {
      HR: 'Assess stage-size fit (0->10M vs 10M->100M ARR), board governance maturity, self-awareness on blind spots, and mandate clarity.',
      Behavioral: 'Probe painful layoffs/exec exits, investor expectation resets, and pivoting thesis when data invalidated founder intuition.',
      Technical: 'Drill P&L mechanics: gross margin drag (hosting + CS), payback cohorts, pricing power levers, and capital allocation kill gates.',
      'Live Coding': 'Board & Crisis Case: diagnose NRR drop + high burn multiple; force concrete choices between headcount freeze, ICP narrowing, and pricing restructure.',
      'System Design': 'Multi-year Operating & GTM Model: design org structure (GM vs functional), geo expansion gates, and M&A build-vs-buy criteria.',
      Negotiation: 'Balance base vs milestone equity, single/double-trigger acceleration on change of control, severance terms, and board seat/voting protections.'
    },
    powerPhrases: [
      'Before doubling down on acquisition, I separate logo churn from price expansion so our Net Retention doesn’t mask an ICP mismatch.',
      'Capital allocation is strategy made concrete: every incremental euro goes against verified payback months and explicit kill criteria.'
    ]
  },

  coo: {
    mandate: 'Translate strategic targets into predictable, margin-accretive execution by eliminating cross-functional handoff friction and building self-healing operating rhythms.',
    mentalModels: [
      'Operating Cadence Architecture: Weekly Business Reviews (leading input KPIs + Red/Amber/Green anomaly triage), Monthly Financial/Margin Sync, and Quarterly OKR Resets.',
      'Linearity Breaking (Scale Without Headcount Parity): Track Cost-to-Serve per customer, Support Tickets per Active Account, and Onboarding Cycle Time.',
      'RevOps Bowtie Funnel: Sales Close -> Implementation/KYB -> Time-to-First-Value (TTFV) -> Adoption -> Renewal/Expansion; 60% of churn originates in broken handoffs.',
      'SLA vs Cost Margin Trade-Off: Define tiered service guarantees (Enterprise dedicated vs Self-serve automated) rather than gold-plating every ticket.'
    ],
    probeLadders: [
      { claim: 'Volume will triple so we need 3x ops headcount', probe: 'Push on root-cause ticket deflection, self-serve tooling, and batching workflows to keep ops growth sublinear (<0.4x volume).' },
      { claim: 'We rolled out company-wide OKRs', probe: 'Test whether OKRs are activity checklists vs owned outcome ratios with a single-threaded DRI and weekly leading indicators.' },
      { claim: 'I fixed an SLA breach', probe: 'Ask how they distinguished an acute staffing spike from a structural product defect, and what systemic guardrail stopped recurrence.' }
    ],
    redFlags: [
      'Building heavy bureaucratic approval committees instead of clear DRI ownership and fast feedback loops.',
      'Treating every operational bottleneck with more hiring instead of upstream defect elimination.',
      'Zero fluency with unit economics (Gross Margin %, Support Cost/ARR, Payback impact).'
    ],
    roundRubrics: {
      HR: 'Validate CEO-COO chemistry (visionary vs operator complement), span of control managed (Ops, CS, RevOps, People, Legal), and scale cadence.',
      Behavioral: 'Probe cleaning up messy cross-org ownership wars (Sales promising unbuildable SLAs to CS/Product) and tough cost restructuring.',
      Technical: 'Drill Weekly Business Review design, OKR governance failure modes, vendor/procurement SLAs, KYB/compliance throughput, and margin levers.',
      'Live Coding': 'Live Ops Triage: 3x onboarding surge causing 14-day SLA breach and rising refund churn—sequence 30-day containment vs 90-day automation.',
      'System Design': 'Design full RevOps + CS + Support operating model scaling from 500 to 5,000 B2B customers while expanding gross margin 5 points.',
      Negotiation: 'Calibrate dual-trigger KPI bonuses tied to Gross Margin + NRR, functional P&L scope, and executive succession clarity.'
    },
    powerPhrases: [
      'We don’t scale operations linearly with volume; every recurring manual handoff either gets productized or explicitly priced into an enterprise tier.',
      'If two teams co-own an SLA, nobody owns it—I enforce single-threaded DRIs paired with upstream handoff acceptance criteria.'
    ]
  },

  cto: {
    mandate: 'Turn engineering and cloud architecture into durable commercial leverage—maximizing product velocity, reliability, and gross margin without drowning the org in accidental complexity.',
    mentalModels: [
      'Engineering Efficiency & Quality Balance: DORA Metrics (Deployment Frequency, Lead Time, MTTR, Change Failure Rate) paired with SPACE (developer satisfaction/flow) to stop velocity gaming.',
      'FinOps & Gross Margin Ownership: Track Cloud COGS % of ARR and cost per tenant/transaction; architectural choices directly move company valuation.',
      'Conway’s Law & Team Topologies: Organize Stream-Aligned squads backed by thin Platform/Enabling teams so squads ship independently without central CAB bottlenecks.',
      'Risk & Compliance as Enablers: SOC2/ISO27001/PCI controls automated in CI/CD, plus blameless postmortems producing concrete systemic fixes.'
    ],
    probeLadders: [
      { claim: 'We need a 6-month platform rewrite for tech debt', probe: 'Challenge as CFO/CEO: how do you deliver incremental business value (Strangler Fig), quantify cost-of-delay, and prove ROI inside 90 days?' },
      { claim: 'We moved to microservices for scalability', probe: 'Probe whether team size (<40 devs) justified distributed failure/latency overhead vs a clean modular monolith.' },
      { claim: 'Our cloud bill jumped 40%', probe: 'Ask for unit-cost diagnostics (egress, unindexed queries, idle k8s nodes, uncached AI calls) vs blanket cost cuts hurting SLAs.' }
    ],
    redFlags: [
      'Chasing hype architecture (k8s/multi-region/microservices) when customer pain is onboarding latency or basic reliability.',
      'Failing to translate technical risks (reliability debt, single points of failure, security) into revenue, churn, or margin impact.',
      'Micro-managing PRs instead of growing Staff engineers and clear architectural decision records (ADRs).'
    ],
    roundRubrics: {
      HR: 'Calibrate technical-vs-executive split (hands-on coding vs org/board leadership), target org size (15->150+ eng), and C-suite communication clarity.',
      Behavioral: 'Probe retiring an engineer-beloved legacy/overengineered system, managing major customer outages to board/enterprise clients, and Staff succession.',
      Technical: 'Drill DORA/SPACE metrics, FinOps gross margin optimization, AI/LLM ROI vs hype, build-vs-buy IRR, and AppSec/compliance automation.',
      'Live Coding': 'CTO Exec Scenario: Cloud COGS jumped 35% while release frequency fell—run a 60-day diagnostic across FinOps, CI bottlenecks, and org topology.',
      'System Design': 'Design 100-engineer R&D topology + multi-tenant platform evolution + reliability governance to hit 99.95% SLA and <12% Cloud COGS/ARR.',
      Negotiation: 'Align board reporting access, R&D budget authority, equity vesting refreshers, and VP/Staff hiring autonomy.'
    },
    powerPhrases: [
      'Every architecture decision is an economic trade-off: I measure tech debt in blocked roadmap weeks, incident MTTR, and gross margin drag.',
      'We avoid ivory-tower rewrites—we isolate high-change domains behind clean contracts and migrate incrementally under production telemetry.'
    ]
  },

  cfo: {
    mandate: 'Protect cash runway and valuation multiples through razor-sharp SaaS unit economics, clean GAAP/IFRS controls, and ruthless capital allocation discipline.',
    mentalModels: [
      'SaaS Revenue Hierarchy: Bookings (contracted TCV/ACV) -> Billings (cash invoiced) -> Deferred vs Recognized Revenue (ASC 606 / IFRS 15) -> ARR (recurring run-rate minus one-offs).',
      'Retention Integrity: NRR = (Start ARR + Expansion - Contraction - Churn) / Start ARR; ALWAYS inspect Gross Retention (GRR) separately so pricing increases don’t hide logo bleed.',
      'Go-To-Market Capital Efficiency: Magic Number (Net New ARR * 4 / Prior Qtr S&M), CAC Payback (CAC / (ARPA * Gross Margin %)), and LTV:CAC with realistic churn tail.',
      'Working Capital & Risk Controls: Annual upfront collections vs deferred revenue liability, FX hedging on multi-currency EU/US revenue, SOC/audit readiness.'
    ],
    probeLadders: [
      { claim: 'NRR is 118% so retention is strong', probe: 'Challenge with GRR: what if 20% of SMB logos churned while 3 enterprise price hikes temporarily lifted NRR?' },
      { claim: 'We should trim 15% from burn', probe: 'Force surgical triage across R&D capitalization, Cloud COGS margin, and low-payback paid channels without starving high-velocity cohorts.' },
      { claim: 'AI features are driving adoption', probe: 'Probe token/GPU variable COGS erosion on SaaS 80% gross margin benchmarks and how pricing tiering recovers margin.' }
    ],
    redFlags: [
      'Blurring one-time implementation/services revenue into pure software ARR multiples.',
      'Reporting backward-looking accounting only instead of forward driver-based cash & scenario planning.',
      'Ignoring contract payment terms and DSO cash conversion drag during rapid enterprise scaling.'
    ],
    roundRubrics: {
      HR: 'Validate audit/fundraising history (Series B/C, PE, M&A, debt facilities), multi-entity/FX fluency, and strategic partner vs scorekeeper posture.',
      Behavioral: 'Probe delivering an unwelcome forecast cut to CEO/Board, catching material control gaps, and renegotiating lender/vendor terms.',
      Technical: 'Drill ASC 606/IFRS 15 SaaS accounting, gross margin (hosting + CS + AI inference), Magic Number, cohort payback, and cash sensitivity models.',
      'Live Coding': 'CFO Board Case: Burn Multiple hit 2.6x with GRR slipping to 84%—model 3 runway levers (collections, COGS, S&M payback) for immediate board approval.',
      'System Design': 'Architect multi-entity FP&A, RevOps quote-to-cash controls, pricing/packaging telemetry, and board reporting cadence.',
      Negotiation: 'Discuss audit committee reporting line, equity/exit waterfall mechanics, sign-on bridge for forfeited bonus, and finance team budget.'
    },
    powerPhrases: [
      'I separate Bookings, Cash Collections, GAAP Revenue, and True ARR ruthlessly—and never let expansion upsell mask underlying Gross Retention decay.',
      'Every growth plan must pass two gates: gross-margin-adjusted CAC payback and downside runway preservation if pipeline slips 25%.'
    ]
  },

  cro: {
    mandate: 'Build a repeatable, forecastable revenue engine where pipeline math, qualification rigor, and post-sale expansion compound Net Dollar Retention without hero-driven quarter-end discounting.',
    mentalModels: [
      'Pipeline Coverage Math: Required Qualified Pipeline = Target New ARR / Win Rate, adjusted for Slippage & Sales Cycle Length (typically 3.5x–4x stage-2+ coverage).',
      'Enterprise Deal Rigor (MEDDPICC): Metrics (quantified ROI), Economic Buyer (direct access), Decision Criteria & Process, Paper Process (InfoSec/Legal), Identified Pain, Champion (tested), Competition.',
      'Rep Productivity Distribution: Check % of reps hitting >=80% quota, Ramp Time (3–6m), Quota-to-OTE ratio (4x–5x SaaS norm), not just top-3 heroic deals.',
      'Give-Get Commercial Discipline: Trade concessions (price/terms) ONLY for concrete gets (multi-year lock, upfront annual cash, case study, faster close date).'
    ],
    probeLadders: [
      { claim: 'The deal is Commit for Friday', probe: 'Stress-test Paper Process & Champion: has Legal completed redlines, InfoSec signed off, and has the Champion actually tested the Economic Buyer?' },
      { claim: 'We missed quarter because Marketing gave weak leads', probe: 'Probe Outbound self-sourced quota share, SDR/AE SLA adherence, and win-loss conversion drop by stage.' },
      { claim: 'Offer a 30% discount to hit target', probe: 'Challenge lifetime ACV anchor destruction and renewal cliff; demand creative structure (ramp seats or multi-year lock) instead.' }
    ],
    redFlags: [
      'Happy-ears forecasting driven by rep optimism rather than verifiable buyer actions.',
      'Building compensation plans that reward bad-fit churn-prone logos without clawbacks or NRR alignment.',
      'Treating Customer Success as post-sale support instead of a co-owned net retention and expansion engine.'
    ],
    roundRubrics: {
      HR: 'Verify ACV range ($15k SMB vs $150k+ Enterprise), direct closing vs managing managers, and track record scaling repeatable playbooks.',
      Behavioral: 'Probe turning around an underperforming region/pod, killing a bloated bad-fit deal to protect margin, and resolving Sales-vs-CS churn friction.',
      Technical: 'Drill MEDDPICC audit, stage exit criteria, quota/OTE architecture, SDR/AE/AM pod ratios, and pipeline-to-bookings predictability.',
      'Live Coding': 'Live Forecast & Deal Clinic: 2 quarters of slipping Enterprise deals and 40% quota attainment—recalibrate pipeline stages, enablement, and give-get rules.',
      'System Design': 'Design full GTM Revenue Architecture (Inbound PLG assist + Mid-Market Velocity + Enterprise Pods) including territory carve-up and comp incentives.',
      Negotiation: 'Structure 50/50 or 60/40 Base/OTE split, accelerators above 100%, NRR/multi-year kickers, ramp draw, and equity upside.'
    },
    powerPhrases: [
      'I never forecast on rep confidence—I forecast on verified buyer milestones, Legal/InfoSec paper timelines, and direct Economic Buyer pain.',
      'Healthy growth comes from 65%+ rep quota participation and strict give-get discipline, not quarter-end 35% panic discounts.'
    ]
  },

  em: {
    mandate: 'Multiply team engineering output, technical quality, and retention simultaneously through clear expectations, psychological safety, and crisp product-engineering trade-offs.',
    mentalModels: [
      'Manage Outcomes Not Hours: Balance DORA flow metrics (PR cycle time, deploy cadence, CFR) with team health and sustainable WIP limits.',
      'Skill vs Will vs Clarity Matrix: Diagnose missed commitments accurately—ambiguous specs, systemic blockers, skill mismatch, or disengagement require opposite interventions.',
      'Feedback & Coaching Cadence: SBI (Situation-Behavior-Impact) delivered promptly; clear 30-60-90 PIP/coaching benchmarks with zero ambush at annual review.',
      'Reliability Budget Negotiation: Ring-fence ~15–20% capacity for operational resilience & paying high-interest debt tied to real incident/velocity pain.'
    ],
    probeLadders: [
      { claim: 'I jumped in and coded the release myself to save the deadline', probe: 'Spot hero-syndrome anti-pattern: what happened next sprint when the same dependency hit, and how did you grow ownership in the team?' },
      { claim: 'An engineer is underperforming', probe: 'Probe concrete documentation, whether expectation drift was manager-caused, and how they handled retention vs fair exit.' },
      { claim: 'PM keeps sneaking urgent features mid-sprint', probe: 'Ask how they surfaced explicit scope-vs-date-vs-quality trade-offs so stakeholders chose consciously.' }
    ],
    redFlags: [
      'Acting as a glorified Scrum Jira clerk OR remaining a lone-wolf super-IC hoarding complex code.',
      'Avoiding direct hard performance conversations out of misplaced niceness.',
      'Measuring developer productivity by LOC, raw commit count, or story-point inflation.'
    ],
    roundRubrics: {
      HR: 'Validate span of control (1 vs 2-3 squads, 6-18 reports), hands-on architectural literacy vs people leadership split, and remote/async habits.',
      Behavioral: 'Probe managing a struggling senior engineer, mediating Staff Eng vs PM clashes, onboarding senior hires, and retaining talent through uncertainty.',
      Technical: 'Drill sprint predictability without crunch, technical risk visibility, structured interview rubrics, incident/on-call health, and architecture reviews.',
      'Live Coding': 'People & Delivery Case: key senior engineer threatens resignation over tech debt + PM demands Q3 launch—resolve retention, scope, and morale.',
      'System Design': 'Design team topology, on-call rotation, CI/CD ownership, and engineering career ladder/growth path across 3 growing squads (25 engineers).',
      Negotiation: 'Calibrate M3/M4 level scope, hiring headcount budget, LTI equity, and cross-functional reporting clarity.'
    },
    powerPhrases: [
      'Heroics might rescue one Friday deploy, but sustainable delivery comes from lowering PR batch size, crisp ownership, and honest scope trade-offs.',
      'Good performance feedback removes surprises: clear written expectations, rapid SBI loops, and unblocking systemic bottlenecks first.'
    ]
  }
};
