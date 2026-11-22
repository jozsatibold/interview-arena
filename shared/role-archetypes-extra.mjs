/**
 * Additional Tech Company Roles (CFO, CRO, Growth/PMM, Solutions, Go, Rust, iOS, Mobile, Android, C++, TPM, CSM, People Ops)
 * Plus grouped dropdown taxonomy & UI topic label resolver to keep shared/role-archetypes.mjs modular.
 */

export const ROLE_TRACK_GROUPS = [
  {
    group: 'Executive & C-Suite',
    roles: [
      { id: 'ceo', label: '🏛️ CEO / Founder / GM' },
      { id: 'coo', label: '⚙️ COO / VP Operations' },
      { id: 'cto', label: '🧭 CTO / VP Engineering' },
      { id: 'cfo', label: '💹 CFO / VP Finance' },
      { id: 'cro', label: '📈 CRO / VP Sales / Enterprise GTM' }
    ]
  },
  {
    group: 'Leadership, Delivery & Field',
    roles: [
      { id: 'em', label: '👥 Engineering Manager' },
      { id: 'techlead', label: '⚡ Tech Lead / Staff+' },
      { id: 'tpm', label: '📅 TPM / Scrum Master / Delivery' },
      { id: 'solutions', label: '🌉 Solutions Architect / Sales Eng' }
    ]
  },
  {
    group: 'Product, Design & Growth',
    roles: [
      { id: 'pm', label: '📦 Product Manager' },
      { id: 'po', label: '📋 Product Owner / Scrum' },
      { id: 'design', label: '🎨 Product / UX Designer' },
      { id: 'marketing', label: '📣 Growth & Product Marketing' }
    ]
  },
  {
    group: 'Customer Success & People Ops',
    roles: [
      { id: 'csm', label: '🤝 Customer Success / TAM / Support' },
      { id: 'people', label: '🧑‍💼 People Ops / HRBP / Tech Recruiter' }
    ]
  },
  {
    group: 'Engineering, Mobile, Data & Security',
    roles: [
      { id: 'frontend', label: '🌐 Frontend / Full-Stack TS' },
      { id: 'java', label: '☕ Java / JVM & Spring' },
      { id: 'dotnet', label: '🔷 .NET / C# Engineering' },
      { id: 'python', label: '🐍 Python / Backend & AI' },
      { id: 'php', label: '🐘 PHP / Laravel & Symfony' },
      { id: 'go', label: '🐹 Go (Golang) & Cloud' },
      { id: 'rust', label: '🦀 Rust / Systems & Engine' },
      { id: 'cpp', label: '⚙️ C / C++20 Systems & Embedded' },
      { id: 'ios', label: '🍎 iOS (Swift & Objective-C)' },
      { id: 'android', label: '🤖 Android (Kotlin & Compose)' },
      { id: 'mobile', label: '📲 Mobile (RN / Flutter / Cordova)' },
      { id: 'flutter', label: '📱 Flutter / Dart' },
      { id: 'qa', label: '🧪 QA / SDET Automation' },
      { id: 'devops', label: '☁️ DevOps / SRE / Cloud' },
      { id: 'data', label: '📊 Data / ML / Analytics' },
      { id: 'security', label: '🛡️ Security / AppSec / CISO' },
      { id: 'general', label: '💻 Senior Software Engineer' }
    ]
  }
];

export function resolveTopicUiLabelsForCategory(cat = 'engineering', archKey = 'general') {
  if (cat === 'executive') {
    return { HR: 'Exec Screen', Behavioral: 'Leadership', Technical: 'Strategy & Ops', 'Live Coding': 'Exec Scenario', 'System Design': 'Org & Scale', Negotiation: 'Board & Comp' };
  }
  if (cat === 'gtm') {
    return { HR: 'GTM Screen', Behavioral: 'Deal & Alignment', Technical: 'GTM & Metrics', 'Live Coding': 'Live Case', 'System Design': 'Revenue Scale', Negotiation: 'OTE & Mandate' };
  }
  if (cat === 'solutions') {
    return { HR: 'Field Screen', Behavioral: 'Stakeholders', Technical: 'Arch & PoC', 'Live Coding': 'Live Discovery', 'System Design': 'Client Blueprint', Negotiation: 'OTE & Scope' };
  }
  if (cat === 'tpm') {
    return { HR: 'Delivery Screen', Behavioral: 'Alignment', Technical: 'Program & Risk', 'Live Coding': 'Live Risk Case', 'System Design': 'Cross-Org Plan', Negotiation: 'Scope & Comp' };
  }
  if (cat === 'csm') {
    return { HR: 'CS Screen', Behavioral: 'Escalations', Technical: 'NRR & Health', 'Live Coding': 'Live QBR Case', 'System Design': 'CS Playbook', Negotiation: 'OTE & Comp' };
  }
  if (cat === 'people') {
    return { HR: 'Talent Screen', Behavioral: 'Culture & STAR', Technical: 'People Craft', 'Live Coding': 'Live HR Case', 'System Design': 'Org & Hiring', Negotiation: 'Offer & Scope' };
  }
  if (cat === 'product') {
    return { HR: 'Product Screen', Behavioral: 'Stakeholders', Technical: 'Product Craft', 'Live Coding': 'Live Case', 'System Design': 'Strategy & Plan', Negotiation: 'Scope & Comp' };
  }
  if (cat === 'design') {
    return { HR: 'Design Screen', Behavioral: 'Collaboration', Technical: 'UX & Systems', 'Live Coding': 'Whiteboard UX', 'System Design': 'Design System', Negotiation: 'Scope & Comp' };
  }
  if (archKey === 'em') {
    return { HR: 'Lead Screen', Behavioral: 'People & STAR', Technical: 'Delivery & Risk', 'Live Coding': 'People Scenario', 'System Design': 'Org Topology', Negotiation: 'Comp & Mandate' };
  }
  return { HR: 'HR & Pitch', Behavioral: 'Behavioral', Technical: 'Technical', 'Live Coding': 'Live Coding', 'System Design': 'System Design', Negotiation: 'Negotiation' };
}

export function getLeadershipTier(archKey = 'general') {
  const key = String(archKey || 'general').trim();
  if (['ceo', 'coo', 'cto', 'cfo', 'cro'].includes(key)) return 'executive';
  if (['em', 'tpm', 'people'].includes(key)) return 'manager';
  return 'ic';
}

export const EXECUTIVE_PATH_BLUEPRINT = [
  { day: 1, title: 'Executive Search Calibration', topic: 'HR', agent: '01-hr-recruiter-screening.md', focus: 'Establish company stage fit ($10M->$100M ARR), Board mandate clarity, and C-suite compensation anchor.' },
  { day: 2, title: 'P&L, Burn & Unit Economics', topic: 'Technical', agent: '03-technical-deep-dive-architecture.md', focus: 'Defend Burn Multiple, GRR vs NRR cohort health, gross margin levers, and capital allocation rules.' },
  { day: 3, title: 'First 100-Day Plan Defense', topic: 'Live Coding', agent: '04-live-coding-anti-freeze-trainer.md', focus: 'Present and defend Days 1-30 diagnostics, 31-60 exec bench upgrades, and Days 61-100 Board KPI reset.' },
  { day: 4, title: 'Multi-Year Org & Operating Model', topic: 'System Design', agent: '05-system-design-fintech-saas.md', focus: 'Design executive leadership structure, functional vs GM boundaries, and single-threaded ownership.' },
  { day: 5, title: 'Executive Equity & Bonus Terms', topic: 'Negotiation', agent: '06-salary-contract-negotiation.md', focus: 'Calibrate base vs performance bonus, option/RSU strike dilution, and double-trigger acceleration.' },
  { day: 6, title: 'VC / PE Operating Partner Screen', topic: 'HR', agent: '01b-hr-agency-headhunter.md', focus: 'Pass private-equity / VC operating partner diligence on cash discipline and operational speed.' },
  { day: 7, title: 'Hard Turnarounds & Missed Quarters', topic: 'Behavioral', agent: '02-behavioral-leadership-star.md', focus: 'Walk candidly through firing an exec hire, cutting burn 20%, and resetting Board expectations.' },
  { day: 8, title: 'C-Suite Peer Tension: Deal vs Margin', topic: 'Technical', agent: '03c-tech-nodejs-payments-testing.md', focus: 'Resolve CRO vs CFO vs CTO conflict over bespoke enterprise asks eroding gross margin.' },
  { day: 9, title: 'Boardroom Crisis & Runway Triage', topic: 'Live Coding', agent: '04b-live-coding-data-state-analytics.md', focus: 'Run live triage on a sharp NRR dip and 1.9x->2.5x burn spike under investor skepticism.' },
  { day: 10, title: 'Board Chair Thesis & Chemistry', topic: 'HR', agent: '01c-hr-founder-vp-chemistry.md', focus: 'Align with the Board Chair / CEO on vision, governance candor, and mutual due diligence.' },
  { day: 11, title: 'GTM, Pricing Power & ICP Shift', topic: 'Technical', agent: '03b-tech-angular-nx-rxjs.md', focus: 'Sharpen category wedge, enterprise vs SMB churn trade-offs, and net expansion pricing lifts.' },
  { day: 12, title: 'C-Suite Alignment & Peer Buy-In', topic: 'Behavioral', agent: '02b-behavioral-product-and-growth.md', focus: 'Demonstrate uniting Product, Engineering, Finance, and Revenue behind a single annual bet.' },
  { day: 13, title: 'Enterprise Risk & Audit Triage', topic: 'Technical', agent: '03d-tech-bug-triage-and-pr-review.md', focus: 'Diagnose margin leaks, SLA collapses, or SOC2/audit failures rapidly with clear DRI accountability.' },
  { day: 14, title: 'Geo Expansion & M&A Integration', topic: 'System Design', agent: '05-system-design-fintech-saas.md', focus: 'Evaluate build-vs-buy M&A thesis, post-merger culture integration, and multi-region risk gates.' },
  { day: 15, title: 'Executive Deal & M&A Case', topic: 'Live Coding', agent: '04c-live-coding-widgets-dom-maps.md', focus: 'Negotiate high-stakes pricing restructure or M&A integration bottleneck live under pressure.' },
  { day: 16, title: 'CEO / Board Chair Reverse Diligence', topic: 'HR', agent: '01c-hr-founder-vp-chemistry.md', focus: 'Interrogate Board alignment, unstated political conflicts, true runway, and decision autonomy.' },
  { day: 17, title: '360° Failures & Backchannel Audit', topic: 'Behavioral', agent: '02-behavioral-leadership-star.md', focus: 'Answer tough backchannel reference probes about your sharpest executive blind spots honestly.' },
  { day: 18, title: 'Long-Horizon Scaling & Governance', topic: 'System Design', agent: '05-system-design-fintech-saas.md', focus: 'Architect multi-year R&D, GTM, and Board reporting cadence for predictable Rule-of-40 compounding.' },
  { day: 19, title: 'Board Mandate, Severance & Vesting', topic: 'Negotiation', agent: '06b-negotiation-eu-b2b-contracts.md', focus: 'Close governance charter, change-of-control protections, good-leaver severance, and board observer rights.' },
  { day: 20, title: 'Final Executive Comp & Start Close', topic: 'Negotiation', agent: '06-salary-contract-negotiation.md', focus: 'Lock final package structure, sign-on bonus bridge, and Day-1 executive transition plan.' }
];

export const MANAGER_PATH_BLUEPRINT = [
  { day: 1, title: 'Leadership Scope & Stage Screen', topic: 'HR', agent: '01-hr-recruiter-screening.md', focus: 'Validate span of control (1 vs 3 squads), people-vs-tech ratio, and async remote management habits.' },
  { day: 2, title: 'Delivery, DORA & WIP Governance', topic: 'Technical', agent: '03-technical-deep-dive-architecture.md', focus: 'Establish predictable sprint flow without heroics, PR batch hygiene, and 15-20% reliability budgets.' },
  { day: 3, title: 'Live Roleplay: Underperformer PIP', topic: 'Live Coding', agent: '04-live-coding-anti-freeze-trainer.md', focus: 'Deliver direct SBI feedback to a defensive high-tenure report without drifting into vagueness.' },
  { day: 4, title: 'Hard People & Retention STAR', topic: 'Behavioral', agent: '02-behavioral-leadership-star.md', focus: 'Walk through turning around a struggling senior IC or managing a regrettable/necessary exit fairly.' },
  { day: 5, title: 'Multi-Squad Org & On-Call Scale', topic: 'System Design', agent: '05-system-design-fintech-saas.md', focus: 'Design stream-aligned squad topology, sustainable on-call rotations, and clear DRIs across 25+ people.' },
  { day: 6, title: 'VP / Director Managing-Up Chemistry', topic: 'HR', agent: '01c-hr-founder-vp-chemistry.md', focus: 'Demonstrate translating messy executive ambiguity into crisp team clarity and candid upward risk.' },
  { day: 7, title: 'Cross-Functional PM Conflict', topic: 'Behavioral', agent: '02b-behavioral-product-and-growth.md', focus: 'Negotiate mid-sprint scope injection with Product/Sales cleanly via explicit scope-vs-date swaps.' },
  { day: 8, title: 'Live Roleplay: Burnout & Resignation', topic: 'Live Coding', agent: '04b-live-coding-data-state-analytics.md', focus: 'De-escalate a key Tech Lead threatening resignation over urgent hotfixes and hidden tech debt.' },
  { day: 9, title: 'Hiring Bar, Scorecards & Calibration', topic: 'Technical', agent: '03b-tech-angular-nx-rxjs.md', focus: 'Design structured interview rubrics preventing gut-feel hiring and eliminating uncalibrated bias.' },
  { day: 10, title: 'M3/M4 Leveling & Scope Offer', topic: 'Negotiation', agent: '06-salary-contract-negotiation.md', focus: 'Calibrate management band, hiring headcount authority, equity refreshers, and reporting line.' },
  { day: 11, title: 'Risk, RAID & Blameless Postmortems', topic: 'Technical', agent: '03c-tech-nodejs-payments-testing.md', focus: 'Turn Sev-1 incidents into systemic guardrails and surface red dependencies weeks before slippage.' },
  { day: 12, title: 'Cross-Org Conflict & Escalations', topic: 'Behavioral', agent: '02-behavioral-leadership-star.md', focus: 'Resolve deadlocks between Platform/Security/Product teams with clear written ADR/RAID ownership.' },
  { day: 13, title: 'Execution Audit & Attrition Triage', topic: 'Technical', agent: '03d-tech-bug-triage-and-pr-review.md', focus: 'Diagnose rising CFR, slowing cycle time, or localized attrition spikes using objective telemetry.' },
  { day: 14, title: 'Live Scenario: Mid-Sprint Crisis', topic: 'Live Coding', agent: '04c-live-coding-widgets-dom-maps.md', focus: 'Re-baseline delivery plan live after a 3-week external API or InfoSec dependency slips unexpectedly.' },
  { day: 15, title: 'Career Ladders & Performance OS', topic: 'System Design', agent: '05-system-design-fintech-saas.md', focus: 'Design fair IC vs EM growth ladders, promotion calibration, and onboarding ramp metrics.' },
  { day: 16, title: 'Stakeholder Empathy & Pushback', topic: 'Behavioral', agent: '02b-behavioral-product-and-growth.md', focus: 'Show how you protected engineering focus while still helping Commercial teams hit revenue goals.' },
  { day: 17, title: 'Live Scenario: Unfair Comp / Counteroffer', topic: 'Live Coding', agent: '04-live-coding-anti-freeze-trainer.md', focus: 'Navigate a top performer counteroffer cleanly without breaking internal band equity.' },
  { day: 18, title: '10->50 Person Scaling Operating Model', topic: 'System Design', agent: '05-system-design-fintech-saas.md', focus: 'Prevent process bloat while keeping multi-team dependencies visible during rapid org growth.' },
  { day: 19, title: 'Headcount Budget & Comp Band Terms', topic: 'Negotiation', agent: '06b-negotiation-eu-b2b-contracts.md', focus: 'Negotiate guaranteed hiring reqs, retention budget, and clear charter before signing.' },
  { day: 20, title: 'Final VP Offer & 90-Day Mandate Close', topic: 'Negotiation', agent: '06-salary-contract-negotiation.md', focus: 'Close final compensation and ask incisive due-diligence questions about VP alignment.' }
];

function makeExtraFakeJobs(roleTitle, domainPrefix, compFallback, companies) {
  return companies.map(([company, customTitle, domain, resp]) => ({
    company,
    roleTitle: customTitle || roleTitle,
    domain: domain || domainPrefix,
    compensation: compFallback,
    responsibilities: resp
  }));
}

export const EXTRA_ROLE_ARCHETYPES = {
  cfo: {
    label: 'CFO / VP Finance',
    category: 'executive',
    titleKeywords: ['cfo', 'chief financial officer', 'vp finance', 'vp of finance', 'head of finance', 'financial controller'],
    keywords: ['asc 606', 'ifrs 15', 'arr', 'burn multiple', 'rule of 40', 'fp&a', 'unit economics', 'fundraising', 'treasury', 'audit'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Executive Search — CFO Mandate Screen', badgeText: 'Search' },
      '01b-hr-agency-headhunter.md': { title: 'PE / VC Finance Operating Partner', badgeText: 'PE/VC' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CEO — Strategic Finance Partnership', badgeText: 'CEO' },
      '02-behavioral-leadership-star.md': { title: 'Board Audit Chair — Hard Forecast Resets', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'CRO — Pricing, Deal Desk & Comp Alignment', badgeText: 'Deal' },
      '03-technical-deep-dive-architecture.md': { title: 'SaaS Unit Economics, NRR vs GRR & Margin', badgeText: 'Unit Econ' },
      '03b-tech-angular-nx-rxjs.md': { title: 'ASC 606 / IFRS 15 Revenue & Audit Controls', badgeText: 'GAAP' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Cash Runway, FX Treasury & Working Capital', badgeText: 'Cash' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Board Pack Anomaly & Margin Erosion Audit', badgeText: 'Audit' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Finance Case — Burn Multiple & Rule of 40', badgeText: 'Case' },
      '04b-live-coding-data-state-analytics.md': { title: 'Finance Case — Cohort Retention Bridge', badgeText: 'Cohort' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Finance Case — AI COGS & Pricing Restructure', badgeText: 'Margin' },
      '05-system-design-fintech-saas.md': { title: 'Multi-Entity FP&A & Quote-to-Cash Scale', badgeText: 'FP&A' },
      '06-salary-contract-negotiation.md': { title: 'CFO Equity, Audit Bonus & Mandate Terms', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Board Governance & Exit Acceleration Clauses', badgeText: 'Board' }
    },
    fakeJobs: makeExtraFakeJobs('Chief Financial Officer', 'B2B SaaS & Fintech Finance', '€160k–€240k + Equity', [
      ['VaultPay Europe', 'Chief Financial Officer (Series B/C)', 'Cross-border B2B billing & treasury SaaS (€22M ARR)', [
        'Own board FP&A, ASC 606/IFRS 15 audits, FX liquidity strategy, and Series C investor diligence',
        'Partner with CEO & CRO on pricing packaging, payback discipline, and gross margin expansion above 78%'
      ]],
      ['LumenCloud Platforms', 'VP of Finance & Strategy', 'High-growth DevTools & AI infrastructure vendor across US/EU', [
        'Track cohort NRR/GRR, GPU inference COGS per customer tier, and Magic Number S&M efficiency',
        'Build automated quote-to-cash controls and multi-entity consolidation workflows'
      ]],
      ['NordicLedger Holdings', 'CFO (PE-Backed Vertical SaaS)', 'Portfolio roll-up integrating 4 European ERP software acquisitions', [
        'Lead debt covenant compliance, working capital optimization, and post-M&A finance integration',
        'Align executive incentive plans with Rule of 40 cash conversion targets'
      ]]
    ])
  },

  cro: {
    label: 'CRO / VP Sales / Enterprise GTM',
    category: 'gtm',
    titleKeywords: ['cro', 'chief revenue officer', 'vp sales', 'vp of sales', 'head of sales', 'enterprise account executive', 'sales director'],
    keywords: ['meddpicc', 'meddic', 'arr', 'pipeline coverage', 'quota attainment', 'enterprise sales', 'nrr', 'acv', 'forecasting', 'revops'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Exec GTM Search — Revenue Mandate Screen', badgeText: 'Screen' },
      '01b-hr-agency-headhunter.md': { title: 'VC GTM Partner — Enterprise Calibration', badgeText: 'VC' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CEO — Board Revenue Commit Chemistry', badgeText: 'CEO' },
      '02-behavioral-leadership-star.md': { title: 'Hard Calls — Rep Coaching & Turnarounds', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'VP Product & CS — NRR Expansion Alignment', badgeText: 'NRR' },
      '03-technical-deep-dive-architecture.md': { title: 'Pipeline Coverage Math & MEDDPICC Rigor', badgeText: 'Pipeline' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Enterprise Deal Desk & Give-Get Pricing', badgeText: 'Pricing' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Quota/OTE Comp Plans & Territory Design', badgeText: 'OTE' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Slipping Forecast & Deal Autopsy Clinic', badgeText: 'Deal' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Deal Case — Rescuing Q4 Commit Risk', badgeText: 'Commit' },
      '04b-live-coding-data-state-analytics.md': { title: 'GTM Case — Diagnosing Rep Win-Rate Drop', badgeText: 'WinRate' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Deal Case — Handling 35% Discount Demands', badgeText: 'GiveGet' },
      '05-system-design-fintech-saas.md': { title: 'Full Revenue Engine (PLG + Mid + Ent Pods)', badgeText: 'RevOps' },
      '06-salary-contract-negotiation.md': { title: 'CRO / VP Sales Base, OTE & Accelerators', badgeText: 'OTE' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Multi-Year ACV & Ramp Draw Protections', badgeText: 'Terms' }
    },
    fakeJobs: makeExtraFakeJobs('Chief Revenue Officer', 'Enterprise B2B SaaS GTM', '€150k–€210k Base + €300k+ OTE', [
      ['SentinelFlow Enterprise', 'Chief Revenue Officer (CRO)', 'B2B compliance & workflow automation scaling from €10M to €35M ARR', [
        'Lead 38-person Sales, SDR, Solutions & AM org hitting predictable quarterly Enterprise ARR commits',
        'Enforce MEDDPICC deal hygiene, raise quota participation above 68%, and lift NRR past 122%'
      ]],
      ['Meridian Data EU', 'VP of Sales (EMEA)', 'Series B analytics infrastructure selling €80k–€250k annual contracts', [
        'Build repeatable outbound & partner GTM motions across DACH, UK, and Benelux enterprise accounts',
        'Design equitable territory carve-outs, ramp draws, and non-discounting give-get rules'
      ]],
      ['PayCore Infrastructure', 'Senior Enterprise Account Executive / Sales Director', 'API payments platform targeting Tier-1 marketplaces', [
        'Own full 6–9 month multi-threaded cycles with CFOs, CTOs, Procurement, and Legal teams',
        'Navigate complex InfoSec/MSA redlines cleanly without quarter-end margin erosion'
      ]]
    ])
  },

  marketing: {
    label: 'Growth & Product Marketing (PMM)',
    category: 'gtm',
    titleKeywords: ['product marketing', 'pmm', 'vp marketing', 'head of marketing', 'growth marketing', 'cmo', 'demand generation'],
    keywords: ['positioning', 'icp', 'plg', 'cac', 'ltv', 'attribution', 'product launch', 'messaging', 'conversion funnel', 'abm'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Growth Talent Partner — GTM Scope Screen', badgeText: 'Screen' },
      '01b-hr-agency-headhunter.md': { title: 'Executive GTM Headhunter Brief', badgeText: 'Agency' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CEO / CRO — Pipeline Partnership Fit', badgeText: 'CRO' },
      '02-behavioral-leadership-star.md': { title: 'Sales Alignment & Killing Bad Campaigns', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'VP Product — PLG Activation Collaboration', badgeText: 'PLG' },
      '03-technical-deep-dive-architecture.md': { title: 'ICP Positioning, Category & Wedge Proof', badgeText: 'PMM' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Paid/Organic CAC Payback & Channel Decay', badgeText: 'CAC' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Multi-Touch Attribution & Incrementality', badgeText: 'Attrib' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Messaging & Landing Conversion Teardown', badgeText: 'Tear' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'GTM Case — Paid CAC Spiked 55%', badgeText: 'Funnel' },
      '04b-live-coding-data-state-analytics.md': { title: 'PMM Case — Tier-1 Category Launch Plan', badgeText: 'Launch' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Growth Case — PQL Trial-to-Paid Lift', badgeText: 'PLG' },
      '05-system-design-fintech-saas.md': { title: 'Full-Funnel Demand, Lifecycle & PMM Engine', badgeText: 'Engine' },
      '06-salary-contract-negotiation.md': { title: 'Head of Growth / PMM Compensation', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Pipeline Bonus & Budget Ownership Terms', badgeText: 'Terms' }
    },
    fakeJobs: makeExtraFakeJobs('Head of Product & Growth Marketing', 'B2B SaaS / PLG', '€95k–€145k + Bonus/Equity', [
      ['SignalCraft AI', 'Director of Product Marketing (PMM)', 'Developer & enterprise AI observability suite', [
        'Own April Dunford positioning refresh, competitive battlecards, and Tier-1 product launch playbooks',
        'Partner with Product & Sales on pricing/packaging experiments improving expansion ACV by 25%'
      ]],
      ['FlowDesk SaaS', 'Head of Growth & Demand Generation', 'Self-serve + mid-market B2B collaboration platform', [
        'Drive SQL pipeline efficiency, PQL activation loops, and blended CAC payback under 11 months',
        'Deploy geo/holdout incrementality tests to eliminate wasted dark-funnel attribution spend'
      ]],
      ['LedgerBridge EU', 'Principal Growth Marketing Lead', 'Fintech API infrastructure expanding across Europe', [
        'Run targeted ABM campaigns paired with technical content & win-loss research loops',
        'Align SDR/Marketing handoff SLAs strictly around Sales-Accepted Pipeline'
      ]]
    ])
  },

  solutions: {
    label: 'Solutions Architect / Sales Eng',
    category: 'solutions',
    titleKeywords: ['solutions architect', 'solution architect', 'sales engineer', 'pre-sales', 'presales', 'field engineer', 'customer engineer'],
    keywords: ['poc', 'discovery', 'sso', 'scim', 'saml', 'enterprise integration', 'rfp', 'technical discovery', 'webhook', 'infosec'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Field Talent Partner — SA / SE Screen', badgeText: 'Screen' },
      '01b-hr-agency-headhunter.md': { title: 'Enterprise GTM Recruiter Check', badgeText: 'Agency' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Sales / CTO — Field Bridge Fit', badgeText: 'Field' },
      '02-behavioral-leadership-star.md': { title: 'AE Conflict & High-Stakes Demo Recovery', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Feedback & Unbuilt Feature Pushback', badgeText: 'Scope' },
      '03-technical-deep-dive-architecture.md': { title: 'Enterprise Auth (SAML/SCIM) & API Topology', badgeText: 'Arch' },
      '03b-tech-angular-nx-rxjs.md': { title: 'PoC Scoping, Exit Criteria & Risk Guard', badgeText: 'PoC' },
      '03c-tech-nodejs-payments-testing.md': { title: 'InfoSec, GDPR, SOC2 & Data Residency Q&A', badgeText: 'Trust' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Failed Enterprise Sandbox Integration Triage', badgeText: 'Triage' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Live Discovery — Scoping a 3-Week Bank PoC', badgeText: 'PoC' },
      '04b-live-coding-data-state-analytics.md': { title: 'Live Demo Pivot — Unlisted Feature Objection', badgeText: 'Demo' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Live Integration — Webhook & ERP Sync Map', badgeText: 'Sync' },
      '05-system-design-fintech-saas.md': { title: 'Enterprise Customer Architecture Blueprint', badgeText: 'Design' },
      '06-salary-contract-negotiation.md': { title: 'SA / SE Base + 75/25 Variable Comp Review', badgeText: 'OTE' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Territory Pool vs Quota Commission Terms', badgeText: 'Terms' }
    },
    fakeJobs: makeExtraFakeJobs('Senior Solutions Architect', 'Enterprise SaaS / API Platform', '€105k–€145k OTE', [
      ['CloudHarbor API', 'Principal Solutions Architect (EMEA)', 'Enterprise event-streaming & ledger integration platform', [
        'Run technical discovery with customer CTOs/CISOs covering SAML/SCIM, VPC peering, and EU residency',
        'Design tight 2–3 week PoCs with explicit exit criteria closing €120k–€400k ARR enterprise deals'
      ]],
      ['TrustGate IAM', 'Senior Sales Engineer', 'Zero-trust identity governance & developer security SaaS', [
        'Lead custom technical workshops, InfoSec DDQ reviews, and live Python/TS webhook prototypes',
        'Protect Product engineering from uncompensated custom requests via clean integration workarounds'
      ]],
      ['OmniCommerce Tech', 'Customer Solutions Engineer', 'Headless commerce & ERP middleware serving Tier-1 EU retailers', [
        'Diagnose latency bottlenecks, data mapping edge cases, and multi-warehouse inventory webhooks',
        'Translate technical architecture wins directly into quantified buyer ROI metrics'
      ]]
    ])
  },

  go: {
    label: 'Go (Golang) Backend & Systems',
    category: 'engineering',
    titleKeywords: ['golang', 'go engineer', 'go developer', 'senior go', 'staff go'],
    keywords: ['goroutine', 'grpc', 'protobuf', 'gin', 'echo', 'errgroup', 'pprof', 'concurrency', 'kubernetes'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Backend Talent Partner — Go Screen', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Go / Cloud Recruiter Check', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Eng — Simplicity & Systems Fit', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Production Goroutine Outage STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'PM — Low-Latency API Trade-Offs', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Goroutines, Context & Escape Analysis', badgeText: 'Go' },
      '03b-tech-angular-nx-rxjs.md': { title: 'gRPC, Channels, Mutexes & Race Free', badgeText: 'Conc' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Postgres, Graceful Shutdown & Timeouts', badgeText: 'Net' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'pprof Heap Leak & Slice Alias Triage', badgeText: 'Triage' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Bounded errgroup Pool', badgeText: 'Code' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Concurrent Rate Limiter', badgeText: 'Rate' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Context Cancel Pipeline', badgeText: 'Ctx' },
      '05-system-design-fintech-saas.md': { title: '50k RPS Go Gateway & Worker Mesh', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Senior/Staff Go Comp & Scope', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Remote Go Consulting Terms', badgeText: 'Offer' }
    },
    fakeJobs: makeExtraFakeJobs('Senior Go (Golang) Engineer', 'High-Throughput Cloud Backend', '€90k–€130k', [
      ['MeshStream Cloud', 'Senior Go Platform Engineer', 'Real-time event ingestion handling 120k events/sec on Kubernetes', [
        'Eliminate goroutine leaks, optimize zero-alloc serialization, and profile tail latency via pprof',
        'Design resilient gRPC services with strict context deadlines and graceful shutdown'
      ]],
      ['VaultPay Core', 'Staff Go Systems Engineer', 'Multi-currency payment clearing engine in Go & PostgreSQL', [
        'Guarantee race-free concurrent workers and deterministic idempotency across bank webhooks'
      ]],
      ['TelemetryEdge', 'Senior Backend Engineer (Go)', 'Distributed tracing & alerting SaaS backend', [
        'Build high-concurrency Go collectors and predictable bounded-memory worker pools'
      ]]
    ])
  },

  rust: {
    label: 'Rust / Systems & High-Perf Engine',
    category: 'engineering',
    titleKeywords: ['rust engineer', 'rust developer', 'senior rust', 'staff rust', 'systems engineer rust'],
    keywords: ['tokio', 'cargo', 'actix', 'axum', 'serde', 'wasm', 'borrow checker', 'lifetimes', 'ffi', 'unsafe'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Systems Talent Partner — Rust Screen', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'Global Rust / Infra Headhunter', badgeText: 'Agency' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CTO — Systems Safety Chemistry Call', badgeText: 'CTO' },
      '02-behavioral-leadership-star.md': { title: 'Zero-Panics Reliability Ownership STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'PM — Correctness vs Ship Speed', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Ownership, Lifetimes & Typestates', badgeText: 'Rust' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Tokio Async, Send/Sync & Mutex Rules', badgeText: 'Tokio' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Zero-Copy Parsing, FFI & Soundness', badgeText: 'Perf' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Tokio Worker Stall & Cancel Safety', badgeText: 'Triage' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Zero-Copy Ring / Parser', badgeText: 'Code' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Lock-Safe Async Queue', badgeText: 'Async' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Typestate Machine Builder', badgeText: 'Types' },
      '05-system-design-fintech-saas.md': { title: 'Low-Latency Rust Storage & Wasm Host', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Staff Rust Systems Compensation', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Principal Rust / Security Scope Terms', badgeText: 'Offer' }
    },
    fakeJobs: makeExtraFakeJobs('Senior Rust Systems Engineer', 'Core Infrastructure & Low-Latency Engine', '€105k–€155k', [
      ['ChronicleDB Labs', 'Senior Rust Storage Engineer', 'Distributed time-series database & vectorized query engine', [
        'Architect zero-copy network protocols in Tokio with strict cancellation safety and zero prod panics',
        'Profile allocations, lock contention, and safe C-FFI bindings under high concurrency'
      ]],
      ['Vortex Edge Wasm', 'Staff Rust Runtime Engineer', 'Multi-tenant WebAssembly serverless compute platform', [
        'Harden sandbox boundaries, isolate memory limits, and mentor squads in idiomatic Rust'
      ]],
      ['QuantRelay Systems', 'Senior Backend Engineer (Rust)', 'Sub-millisecond financial order routing and ledger services', [
        'Model strict domain invariants via typestate patterns and deterministic async state machines'
      ]]
    ])
  },

  ios: {
    label: 'iOS Native (Swift & Objective-C)',
    category: 'engineering',
    titleKeywords: ['ios engineer', 'ios developer', 'swift developer', 'swiftui', 'objective-c', 'apple developer'],
    keywords: ['swift', 'objective-c', 'obj-c', 'swiftui', 'uikit', 'xcode', 'uiviewcontroller', 'mainactor', 'autoreleasepool'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Mobile Talent Partner — iOS Screen', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Mobile / iOS Headhunter Brief', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Mobile Lead — Craft & HIG Chemistry', badgeText: 'Lead' },
      '02-behavioral-leadership-star.md': { title: 'App Store Incident & Obj-C Migration', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product/Design — 120Hz Polish Impact', badgeText: 'UX' },
      '03-technical-deep-dive-architecture.md': { title: 'Swift Concurrency, Actors & ARC Cycles', badgeText: 'Swift' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Objective-C Interop, KVO & Blocks', badgeText: 'Obj-C' },
      '03c-tech-nodejs-payments-testing.md': { title: 'SwiftUI State, CoreData & Keychain', badgeText: 'iOS' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Watchdog Hang & Retain Cycle Debug', badgeText: 'Debug' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Actor Refresh Coalescer', badgeText: 'Code' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Retain Cycle & KVO Fix', badgeText: 'ARC' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Smooth Paginated List', badgeText: 'UI' },
      '05-system-design-fintech-saas.md': { title: 'Modular iOS App, Deep Links & Offline', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Senior/Staff iOS Compensation Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Remote EU iOS Contract Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: makeExtraFakeJobs('Senior iOS Engineer (Swift & Obj-C)', 'Native Consumer & Fintech iOS', '€85k–€125k', [
      ['NordPay Wallet', 'Senior iOS Engineer (Swift / Objective-C)', 'Flagship iOS banking & Apple Pay app with 1.8M MAU', [
        'Architect SwiftUI & structured concurrency features while cleanly refactoring legacy Objective-C SDKs',
        'Eliminate ARC retain cycles, enforce Keychain biometrics, and hit 99.96% crash-free sessions'
      ]],
      ['StudioFlow Mobile', 'Staff iOS Platform Engineer', 'Creative pro tablet & phone suite on Apple Silicon / UIKit', [
        'Lead `@MainActor` latency profiling in Xcode Instruments and modular Swift Package Manager builds'
      ]],
      ['CarePulse Health', 'Lead iOS Developer', 'BLE health hardware companion app using Swift & Obj-C bridges', [
        'Own background BLE sync, CoreData concurrency, and seamless Universal Links onboarding'
      ]]
    ])
  },

  mobile: {
    label: 'Cross-Platform Mobile (RN / Flutter / Cordova)',
    category: 'engineering',
    titleKeywords: ['react native', 'mobile developer', 'mobile engineer', 'cordova', 'capacitor', 'ionic', 'cross-platform mobile'],
    keywords: ['react native', 'cordova', 'capacitor', 'ionic', 'flutter', 'dart', 'jsi', 'hermes', 'wkwebview', 'expo'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Mobile Talent Partner — Cross-Platform', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Hybrid/RN Headhunter Screen', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Eng — Mobile Strategy & Bridges', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Store Rejection & Legacy Migration STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'PM — Offline UX & Conversion Impact', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'RN New Arch (JSI/Fabric) & Hermes', badgeText: 'RN' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Cordova / Capacitor WebView & Plugins', badgeText: 'Hybrid' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Flutter Isolates, Biometrics & Offline', badgeText: 'Sync' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Hybrid Bridge Freeze & Scroll Jank Triage', badgeText: 'Triage' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Offline Queue + 401 Mutex', badgeText: 'Sync' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Smooth Virtualized Feed', badgeText: 'Perf' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Native Plugin Bridge Spec', badgeText: 'Bridge' },
      '05-system-design-fintech-saas.md': { title: 'Shared Mobile Arch (RN/Cordova/Native)', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Senior Mobile Engineer Comp Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Remote Mobile Consultant Rate Terms', badgeText: 'Offer' }
    },
    fakeJobs: makeExtraFakeJobs('Senior Cross-Platform Mobile Engineer', 'React Native, Flutter & Hybrid Modernization', '€80k–€120k', [
      ['PocketBank Hybrid', 'Senior Mobile Engineer (React Native / Capacitor)', 'Multi-country retail fintech migrating Cordova modules to modern Native/JSI', [
        'Modernize legacy Cordova/WKWebView bridges cleanly toward Capacitor/RN New Architecture with zero data loss',
        'Own native biometric storage, offline SQLite outbox sync, and 120Hz gesture animations'
      ]],
      ['FleetTrack Go', 'Staff React Native / Mobile Architect', 'Logistics driver app across iOS & Android with offline GPS telemetry', [
        'Optimize Hermes startup time, FlashList rendering, and safe OTA bundle versioning'
      ]],
      ['RetailPay App', 'Lead Cross-Platform Engineer (RN / Flutter)', 'POS & merchant checkout app spanning iOS/Android hardware peripherals', [
        'Build typed C++/MethodChannel hardware bridges and rock-solid E2E release pipelines'
      ]]
    ])
  },

  android: {
    label: 'Android Native (Kotlin & Jetpack Compose)',
    category: 'engineering',
    titleKeywords: ['android engineer', 'android developer', 'kotlin developer', 'jetpack compose', 'senior android'],
    keywords: ['kotlin', 'jetpack compose', 'coroutines', 'stateflow', 'workmanager', 'room', 'hilt', 'gradle', 'r8', 'play vitals'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Mobile Talent Partner — Android Screen', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Android / Kotlin Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Mobile Lead — Craft & Play Vitals Fit', badgeText: 'Lead' },
      '02-behavioral-leadership-star.md': { title: 'OEM ANR Incident & XML->Compose STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product/Design — 120Hz Android UX ROI', badgeText: 'UX' },
      '03-technical-deep-dive-architecture.md': { title: 'Kotlin Coroutines, Flow & Lifecycle', badgeText: 'Kotlin' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Jetpack Compose Stability & Profiling', badgeText: 'Compose' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Room, WorkManager & Process Death', badgeText: 'Offline' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Play Vitals ANR & Recomposition Debug', badgeText: 'ANR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Lifecycle-Safe Flow Sync', badgeText: 'Code' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Stable LazyColumn State', badgeText: 'UI' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — WorkManager Retry Queue', badgeText: 'Sync' },
      '05-system-design-fintech-saas.md': { title: 'Modular Android App & Offline Outbox', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Senior/Staff Android Compensation', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Remote Android Contract Terms', badgeText: 'Offer' }
    },
    fakeJobs: makeExtraFakeJobs('Senior Android Engineer (Kotlin)', 'Native Android Fintech & Consumer', '€85k–€125k', [
      ['EuroWallet Mobile', 'Senior Android Engineer (Kotlin / Compose)', 'Digital banking & NFC tap-to-pay app serving 2.4M Android users', [
        'Lead Jetpack Compose modernization, Baseline Profiles, and sub-0.1% Play Vitals ANR stability',
        'Build process-death-safe Room + WorkManager offline sync and biometric Keystore auth'
      ]],
      ['MobilityGo EU', 'Staff Android Platform Engineer', 'Real-time ride & transit navigation app across fragmented Android OEMs', [
        'Optimize cold start latency, R8 shrinking, and modular Gradle build times'
      ]],
      ['MedTrack Care', 'Lead Kotlin Developer', 'BLE medical wearable companion with strict offline data resilience', [
        'Design structured Coroutines/StateFlow telemetry pipelines and automated Compose UI tests'
      ]]
    ])
  },

  cpp: {
    label: 'C / C++20 Systems & Embedded',
    category: 'engineering',
    titleKeywords: ['c++ engineer', 'c++ developer', 'cpp engineer', 'embedded engineer', 'systems engineer c++', 'firmware engineer'],
    keywords: ['c++', 'c++20', 'raii', 'cmake', 'bazel', 'embedded', 'rtos', 'lock-free', 'asan', 'tsan', 'cache locality'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Systems Talent Partner — C/C++ Screen', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'HFT / Robotics / Embedded Headhunter', badgeText: 'Agency' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Eng — Low-Latency Craft Fit', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Heisenbug / Memory Corruption STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Hardware/Product — Latency vs Safety', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'RAII, Ownership, Move & Rule of Five', badgeText: 'C++20' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Cache Locality, False Sharing & Alloc', badgeText: 'Perf' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Atomics, Memory Order & Sanitizers', badgeText: 'Conc' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Dangling string_view & UB Triage', badgeText: 'UB' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — SPSC Ring / Pool Alloc', badgeText: 'Code' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — False Sharing Bench Fix', badgeText: 'Cache' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Zero-Copy Frame Parser', badgeText: 'Parse' },
      '05-system-design-fintech-saas.md': { title: 'Sub-Millisecond C++ Ingestion Engine', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Staff C++ Systems Comp Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Low-Latency / Robotics Contract Terms', badgeText: 'Offer' }
    },
    fakeJobs: makeExtraFakeJobs('Senior C++20 Systems Engineer', 'Low-Latency Engine & Robotics', '€100k–€155k', [
      ['PulseOrder Matching', 'Senior C++20 Low-Latency Engineer', 'Sub-50us order routing and market data normalization engine', [
        'Eliminate heap allocations, cache-line false sharing, and UB across hot matching paths',
        'Enforce ASan/TSan/UBSan CI gates and deterministic Linux `perf` micro-benchmarks'
      ]],
      ['AeroSense Robotics', 'Staff Embedded C++ Engineer', 'Autonomous warehouse sensor fusion & real-time control firmware', [
        'Design deterministic RAII abstractions, lock-free SPSC queues, and safe hardware DMA boundaries'
      ]],
      ['VectorCore Graphics', 'Senior C++ Performance Engineer', 'Cross-platform real-time CAD & simulation geometry kernel', [
        'Refactor AoS structures to cache-friendly SoA SIMD pipelines cutting frame compute by 4x'
      ]]
    ])
  },

  tpm: {
    label: 'TPM / Scrum Master / Delivery Lead',
    category: 'tpm',
    titleKeywords: ['technical program manager', 'tpm', 'program manager', 'scrum master', 'agile coach', 'delivery manager', 'release manager'],
    keywords: ['critical path', 'raid', 'dependencies', 'go/no-go', 'agile delivery', 'scrum', 'release train', 'milestone', 'risk register'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Delivery Talent Partner — TPM Screen', badgeText: 'Screen' },
      '01b-hr-agency-headhunter.md': { title: 'Enterprise Program Headhunter', badgeText: 'Agency' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Eng — Cross-Org Execution Fit', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Rescuing Red Cross-Org Launches STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'PM & EM — Pushing Back on Estimates', badgeText: 'Align' },
      '03-technical-deep-dive-architecture.md': { title: 'Critical Path, Dependencies & RAID', badgeText: 'RAID' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Launch Readiness & Go/No-Go Gates', badgeText: 'Launch' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Migrations, InfoSec & Vendor Cutovers', badgeText: 'Cutover' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Watermelon Status & Slip Root-Cause', badgeText: 'Audit' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Program Case — 3-Week API + InfoSec Slip', badgeText: 'Rescue' },
      '04b-live-coding-data-state-analytics.md': { title: 'Delivery Case — Unblocking 6-Squad Q3', badgeText: 'Plan' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Scrum Case — Breaking Chronic Carryover', badgeText: 'Flow' },
      '05-system-design-fintech-saas.md': { title: '120-Eng Cross-Org Operating Cadence', badgeText: 'Cadence' },
      '06-salary-contract-negotiation.md': { title: 'Staff TPM / Delivery Lead Comp', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Enterprise Program Contract Scope', badgeText: 'Offer' }
    },
    fakeJobs: makeExtraFakeJobs('Staff Technical Program Manager (TPM)', 'Cross-Org Cloud & Regulated Launches', '€95k–€140k', [
      ['ClearBank Cloud EU', 'Staff Technical Program Manager', 'Core ledger migration & multi-country PSD2 banking launches across 8 squads', [
        'Own critical-path dependency maps, RAID risk registers, and objective Go/No-Go readiness gates',
        'Deliver BLUF executive readouts and unblock InfoSec, Legal, and platform bottlenecks early'
      ]],
      ['ScaleGrid Platform', 'Senior Agile Delivery Lead / Scrum Master', 'High-velocity SaaS engineering org scaling from 40 to 120 engineers', [
        'Improve sprint predictability, cut cross-squad carryover, and coach teams on flow metrics'
      ]],
      ['OmniCloud Enterprise', 'Principal Release & Program Manager', 'Global multi-region infrastructure & compliance launch programs', [
        'Coordinate zero-downtime customer migrations and executive escalation decision frameworks'
      ]]
    ])
  },

  csm: {
    label: 'Customer Success / TAM / Support Eng',
    category: 'csm',
    titleKeywords: ['customer success', 'csm', 'technical account manager', 'tam', 'support engineer', 'head of customer success', 'vp customer success'],
    keywords: ['nrr', 'grr', 'qbr', 'ebr', 'churn rescue', 'health score', 'onboarding', 'ttfv', 'renewal', 'escalation'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'CS Talent Partner — Book & NRR Screen', badgeText: 'Screen' },
      '01b-hr-agency-headhunter.md': { title: 'Enterprise SaaS CS Headhunter', badgeText: 'Agency' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CRO / VP CS — Retention Chemistry', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Saving Red Six-Figure Renewals STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product & AE — Escalations & Expansion', badgeText: 'NRR' },
      '03-technical-deep-dive-architecture.md': { title: 'Customer Health Scoring & TTFV Funnel', badgeText: 'Health' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Executive QBRs & Quantified ROI Framing', badgeText: 'QBR' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Tier-3 Escalations, SLAs & Bug Triage', badgeText: 'TAM' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Champion Departure & Adoption Drop Audit', badgeText: 'Risk' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'CS Case — €300k Renewal Churn Rescue', badgeText: 'Rescue' },
      '04b-live-coding-data-state-analytics.md': { title: 'TAM Case — Post-Outage Executive Call', badgeText: 'Crisis' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'CS Case — Turning Flat Account Into +40%', badgeText: 'Expand' },
      '05-system-design-fintech-saas.md': { title: 'Segmented CS Model (SMB to Enterprise)', badgeText: 'Model' },
      '06-salary-contract-negotiation.md': { title: 'CSM / TAM Base + NRR Variable OTE', badgeText: 'OTE' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Enterprise Book Scope & Quota Fairness', badgeText: 'Terms' }
    },
    fakeJobs: makeExtraFakeJobs('Enterprise Customer Success / TAM', 'B2B SaaS Retention & Expansion', '€80k–€125k OTE', [
      ['MetricOps Enterprise', 'Principal Technical Account Manager (TAM)', 'Observability & FinOps SaaS managing €6M enterprise ARR book', [
        'Drive GRR >93% and NRR >122% via outcome-anchored EBR/QBRs and multi-threaded executive sponsors',
        'Partner with Engineering on Tier-3 escalations while protecting roadmap from bespoke one-offs'
      ]],
      ['CloudSign EU', 'Senior Enterprise Customer Success Manager', 'Workflow compliance platform across DACH & UK regulated accounts', [
        'Cut onboarding Time-to-First-Value by 40% and build early-warning health score playbooks'
      ]],
      ['DataStream AI', 'Head of Customer Success & Support', 'Series B SaaS scaling from 200 to 1,200 B2B customers', [
        'Architect tech-touch SMB automation alongside dedicated high-touch enterprise pods'
      ]]
    ])
  },

  people: {
    label: 'People Ops / HRBP / Tech Recruiter',
    category: 'people',
    titleKeywords: ['people ops', 'hrbp', 'human resources', 'head of people', 'vp people', 'tech recruiter', 'talent acquisition', 'talent partner'],
    keywords: ['sourcing funnel', 'scorecards', 'leveling', 'compensation bands', 'attrition', 'enps', 'pip', 'org design', 'onboarding', 'recruiting'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'People Leadership — Mandate Screen', badgeText: 'Screen' },
      '01b-hr-agency-headhunter.md': { title: 'Exec People / Talent Partner Brief', badgeText: 'Exec' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CEO / COO — Culture & Scale Chemistry', badgeText: 'CEO' },
      '02-behavioral-leadership-star.md': { title: 'Tough Coaching, RIFs & Pushback STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'VP Eng — Raising Hiring Bar & Velocity', badgeText: 'Hire' },
      '03-technical-deep-dive-architecture.md': { title: 'Recruiting Funnel Math & Rubrics', badgeText: 'Funnel' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Leveling Ladders, Comp Bands & Equity', badgeText: 'Comp' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Attrition Diagnostics & EU Compliance', badgeText: 'HRBP' },
      '03d-tech-bug-triage-and-pr-review.md': { title: '45% Offer Decline & Bottleneck Audit', badgeText: 'Audit' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'People Case — 110-Day Open Staff Req', badgeText: 'Hiring' },
      '04b-live-coding-data-state-analytics.md': { title: 'HRBP Case — High-Performer Manager Churn', badgeText: 'Coach' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'People Case — Counteroffer vs Pay Equity', badgeText: 'Equity' },
      '05-system-design-fintech-saas.md': { title: '150-Person Talent, Leveling & Review OS', badgeText: 'OrgOS' },
      '06-salary-contract-negotiation.md': { title: 'Head of People / Principal Recruiter Comp', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Leadership Scope & Budget Authority', badgeText: 'Terms' }
    },
    fakeJobs: makeExtraFakeJobs('Head of People / Senior Tech Talent Partner', 'High-Growth Tech Org Scaling', '€85k–€135k', [
      ['NovaScale Tech', 'VP / Head of People & Talent', 'Remote-first European SaaS scaling from 75 to 220 employees', [
        'Own dual IC/Manager career ladders, market-benchmarked comp bands, and structured hiring rubrics',
        'Partner with CEO & VP Eng on org design, manager enablement, and regrettable attrition under 8%'
      ]],
      ['FinForge Labs', 'Principal Technical Recruiter (Eng & Exec)', 'Series B fintech hiring Staff Engineers, PMs, and VP leaders across EU', [
        'Audit stage pass-through bottlenecks, cut time-to-offer under 24 days, and lift offer acceptance >85%'
      ]],
      ['CloudCore Systems', 'Senior HR Business Partner (R&D)', 'Enterprise engineering org of 180 developers across 4 EU hubs', [
        'Coach engineering managers through performance calibration, PIPs, and EU labor compliance'
      ]]
    ])
  }
};
