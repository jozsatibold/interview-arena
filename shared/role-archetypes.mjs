/**
 * Universal Tech Company Role Archetypes (32 Startup & Enterprise Roles: IC -> Lead/EM -> Product/Design/GTM/CS/People -> C-Suite)
 * Drives CV detection, role-track switching, interviewer cards, Fake JDs, 20-Day Path & UI labels.
 */

import {
  EXTRA_ROLE_ARCHETYPES,
  ROLE_TRACK_GROUPS,
  resolveTopicUiLabelsForCategory,
  getLeadershipTier,
  EXECUTIVE_PATH_BLUEPRINT,
  MANAGER_PATH_BLUEPRINT
} from './role-archetypes-extra.mjs';

export { ROLE_TRACK_GROUPS, getLeadershipTier, EXECUTIVE_PATH_BLUEPRINT, MANAGER_PATH_BLUEPRINT };

function makeFakeJobs(roleTitle, domainPrefix, compFallback, companies) {
  return companies.map(([company, customTitle, domain, resp]) => ({
    company,
    roleTitle: customTitle || roleTitle,
    domain: domain || domainPrefix,
    compensation: compFallback,
    responsibilities: resp
  }));
}

export const ROLE_ARCHETYPES = {
  ceo: {
    label: 'CEO / Co-Founder / General Manager',
    category: 'executive',
    titleKeywords: ['ceo', 'chief executive officer', 'chief executive', 'co-founder', 'founder', 'managing director', 'general manager'],
    keywords: ['p&l', 'fundraising', 'board of directors', 'runway', 'arr', 'series a', 'series b', 'm&a', 'company vision', 'turnaround', 'go-to-market'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Executive Search Partner — Board Screen', badgeText: 'Search' },
      '01b-hr-agency-headhunter.md': { title: 'PE / VC Talent Operating Partner', badgeText: 'VC/PE' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Board Chair / Lead Investor Chemistry', badgeText: 'Board' },
      '02-behavioral-leadership-star.md': { title: 'Lead Investor — Hard Calls & Turnarounds', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'CRO — GTM Alignment & Enterprise ARR', badgeText: 'GTM' },
      '03-technical-deep-dive-architecture.md': { title: 'P&L, Unit Economics & Capital Allocation', badgeText: 'P&L' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Category Positioning, ICP & Pricing Power', badgeText: 'Market' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Executive Team Cadence & CFO Alignment', badgeText: 'Exec' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Crisis Simulation & Runway Triage', badgeText: 'Crisis' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Exec Case — Strategic Pivot Under Pressure', badgeText: 'Pivot' },
      '04b-live-coding-data-state-analytics.md': { title: 'Exec Case — Board Q&A & Metric Defense', badgeText: 'Board' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Exec Case — M&A / Pricing Restructuring', badgeText: 'Deal' },
      '05-system-design-fintech-saas.md': { title: 'Multi-Year Org, GTM & Growth Model', badgeText: 'Scale' },
      '06-salary-contract-negotiation.md': { title: 'Executive Equity, Vesting & Bonus Alignment', badgeText: 'Equity' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Board Mandate, Severance & Governance', badgeText: 'Mandate' }
    },
    fakeJobs: makeFakeJobs('Chief Executive Officer', 'B2B SaaS / Fintech', '€180k–€280k + Equity', [
      ['Kestrel Treasury EU', 'Chief Executive Officer (Series B)', 'Multi-country B2B payments platform scaling from €12M to €40M ARR', [
        'Own full P&L, board reporting, capital allocation, and Series C investor narrative',
        'Align Product, Engineering, and Enterprise GTM around net dollar retention > 120%'
      ]],
      ['NorthGate Cloud', 'Managing Director / GM Europe', 'Enterprise AI workflow SaaS expanding across DACH, UK, and Nordics', [
        'Build executive leadership bench, regional GTM playbooks, and strategic partner alliances',
        'Balance aggressive top-line ARR growth with disciplined CAC payback under 14 months'
      ]],
      ['Beacon Growth Holdings', 'CEO (PE-Backed SaaS Portfolio Co.)', 'Mission-critical vertical B2B SaaS modernizing legacy workflows', [
        'Lead 180-person org through pricing packaging overhaul and margin expansion',
        'Identify bolt-on M&A targets and oversee post-merger operational integration'
      ]]
    ])
  },
  coo: {
    label: 'COO / VP Operations',
    category: 'executive',
    titleKeywords: ['coo', 'chief operating officer', 'chief operating', 'vp operations', 'vp of operations', 'head of operations'],
    keywords: ['unit economics', 'okr', 'slas', 'capacity planning', 'customer operations', 'vendor management', 'gross margin', 'SOP', 'cross-functional execution'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Executive Search — COO Mandate Screen', badgeText: 'Search' },
      '01b-hr-agency-headhunter.md': { title: 'PE Operating Partner — Ops Screen', badgeText: 'PE Ops' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CEO / Founder — Execution Partnership', badgeText: 'CEO' },
      '02-behavioral-leadership-star.md': { title: 'Cross-Org Conflict & Accountability STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'CFO — Gross Margin & Cost Discipline', badgeText: 'Margin' },
      '03-technical-deep-dive-architecture.md': { title: 'Operating Cadence, OKRs & KPI Governance', badgeText: 'OKR' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Support, Onboarding & Fulfillment Scaling', badgeText: 'Scale' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Vendor Risk, Compliance & Procurement', badgeText: 'Risk' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'SLA Breach & Bottleneck Root-Cause Audit', badgeText: 'SLA' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Ops Case — Fixing Support Cost Per Ticket', badgeText: 'Cost' },
      '04b-live-coding-data-state-analytics.md': { title: 'Ops Case — Capacity Plan for 3x Volume', badgeText: 'Plan' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Ops Case — Post-Merger Process Integration', badgeText: 'M&A' },
      '05-system-design-fintech-saas.md': { title: 'End-to-End Operating Model & RevOps Scale', badgeText: 'Model' },
      '06-salary-contract-negotiation.md': { title: 'Executive Package & KPI Bonus Structure', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'Fractional / Full-Time COO Scope Terms', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Chief Operating Officer', 'Scaling Tech Operations', '€150k–€230k + Equity', [
      ['FlowLedger Fintech', 'Chief Operating Officer (COO)', 'High-growth EU B2B onboarding & KYB verification SaaS', [
        'Partner with the CEO to turn multi-quarter strategy into crisp departmental OKRs and weekly operating rhythms',
        'Cut customer onboarding turnaround time by 45% while improving gross margin via automation and RevOps alignment'
      ]],
      ['VeloShip Logistics Tech', 'VP of Global Operations', 'Cross-border e-commerce orchestration platform serving 2,400 merchants', [
        'Own capacity planning, CS/Implementation SLAs, compliance audits, and vendor contracts',
        'Eliminate handoff friction between Sales, Onboarding, Product, and Customer Success'
      ]],
      ['Meridian Cloud Health', 'Head of Business Operations', 'Regulated SaaS scaling from Series A to Series C across EU markets', [
        'Design repeatable quarterly planning, forecasting dashboards, and enterprise readiness playbooks'
      ]]
    ])
  },
  cto: {
    label: 'CTO / VP Engineering',
    category: 'executive',
    titleKeywords: ['cto', 'chief technology officer', 'chief technology', 'vp engineering', 'vp of engineering', 'svp engineering'],
    keywords: ['technology strategy', 'finops', 'make vs buy', 'conway', 'soc2', 'iso27001', 'org design', 'board reporting', 'r&d budget', 'dora metrics'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Executive Recruiter — CTO/VP Screen', badgeText: 'Exec' },
      '01b-hr-agency-headhunter.md': { title: 'VC Talent Partner — Tech Exec Screen', badgeText: 'VC' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CEO / Founder — Strategic Alignment Call', badgeText: 'CEO' },
      '02-behavioral-leadership-star.md': { title: 'Re-Org, Turnaround & Retention STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'CPO / Product — Roadmap vs Tech Debt ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Multi-Year Tech Strategy & Make-vs-Buy', badgeText: 'Strat' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Cloud FinOps, Margins & Vendor Lock-In', badgeText: 'FinOps' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Security, SOC2/GDPR & Zero-Trust Risk', badgeText: 'Sec' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Sev-1 Outage Executive Response & Comms', badgeText: 'Sev-1' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Exec Case — Cutting Cloud Spend 35% Fast', badgeText: 'Cost' },
      '04b-live-coding-data-state-analytics.md': { title: 'Exec Case — DORA Metrics & Slow Delivery', badgeText: 'DORA' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Exec Case — AI Adoption & Build Governance', badgeText: 'AI Gov' },
      '05-system-design-fintech-saas.md': { title: 'Org Topology, Platform vs Product Teams', badgeText: 'Org' },
      '06-salary-contract-negotiation.md': { title: 'VP/CTO Comp, Equity & Retention Review', badgeText: 'Equity' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU CTO Advisory / Full-Time Mandate Terms', badgeText: 'Mandate' }
    },
    fakeJobs: makeFakeJobs('CTO / VP of Engineering', 'Enterprise SaaS & Cloud', '€140k–€220k + Equity', [
      ['PaySphere EU', 'Chief Technology Officer (120 Engineers)', 'Regulated European B2B payments & real-time risk engine', [
        'Define 24-month architecture & AI strategy aligned directly with ARR expansion and regulatory compliance (PSD2/SOC2)',
        'Scale 14 autonomous squads, elevate Staff/Principal career ladders, and cut cloud COGS per transaction by 30%'
      ]],
      ['CloudPulse SaaS', 'VP of Engineering', 'Multi-product developer observability platform at Series B scale', [
        'Own engineering velocity (DORA), hiring bar, reliability SLAs, and build-vs-buy decisions',
        'Partner with CPO and CFO on annual R&D budget allocation and roadmap predictability'
      ]],
      ['VeritasAI Systems', 'Fractional / Interim CTO', 'Seed-to-Series-A AI SaaS preparing for enterprise security sign-off', [
        'Establish architecture governance, CI/CD release discipline, and technical due-diligence readiness'
      ]]
    ])
  },
  em: {
    label: 'Engineering Manager / Head of Eng',
    category: 'lead',
    titleKeywords: ['engineering manager', 'head of engineering', 'software development manager', 'director of engineering'],
    keywords: ['1-on-1', 'performance review', 'pip', 'hiring loop', 'sprint velocity', 'psychological safety', 'retention', 'stakeholder management'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Leadership Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Eng Management Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Engineering — Leadership Chemistry', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Underperformer / PIP & Hiring STAR', badgeText: 'People' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Lead — Scope vs Predictability', badgeText: 'PM+EM' },
      '03-technical-deep-dive-architecture.md': { title: 'Delivery Cadence, Tech Debt & Quality', badgeText: 'Exec' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Architecture Review & Senior Delegation', badgeText: 'Arch' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Observability, Incidents & On-Call Health', badgeText: 'Ops' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Slipping Milestone & Dependency Triage', badgeText: 'Risk' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Scenario — Coaching Burned-Out Senior Dev', badgeText: 'Coach' },
      '04b-live-coding-data-state-analytics.md': { title: 'Scenario — Hiring Loop & Bar Calibration', badgeText: 'Hire' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Scenario — Saying No to Unplanned Scope', badgeText: 'Scope' },
      '05-system-design-fintech-saas.md': { title: 'Multi-Squad Delivery & System Boundaries', badgeText: 'Scale' },
      '06-salary-contract-negotiation.md': { title: 'Manager Band, Bonus & Equity Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Head of Engineering Offer Terms', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Engineering Manager', 'Cross-Functional Product Squads', '€105k–€145k', [
      ['CartFlow Commerce', 'Engineering Manager (2–3 Product Squads)', 'High-traffic checkout & merchant analytics platform', [
        'Lead, coach, and retain 12–16 full-stack engineers through structured 1-on-1s and career growth frameworks',
        'Partner closely with PM & Design to keep quarterly delivery predictable without burning out teams'
      ]],
      ['BrightPath FinTech', 'Head of Product Engineering', 'Consumer banking & savings experience across web and mobile', [
        'Own hiring pipelines, blameless incident culture, and cross-squad technical alignment'
      ]],
      ['ScaleOps EU', 'Senior Engineering Manager — Platform', 'Internal developer platform, CI/CD, and cloud observability', [
        'Balance internal customer SLAs, reliability investments, and senior staff succession planning'
      ]]
    ])
  },
  techlead: {
    label: 'Tech Lead / Staff+ Architect',
    category: 'lead',
    titleKeywords: ['tech lead', 'technical lead', 'staff engineer', 'principal engineer', 'solutions architect', 'lead engineer', 'frontend architect'],
    keywords: ['rfc', 'adr', 'mentoring', 'code review', 'technical debt', 'cross-squad', 'architecture governance', 'monorepo', 'system boundaries'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Staff/Lead Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Principal/Lead Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Engineering — Staff Leverage Call', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Cross-Team Disagreement & Influence STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'PM — Shipping Fast vs Refactoring ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'RFCs, Trade-Offs & End-to-End Perf', badgeText: 'RFC' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Modular Boundaries & State Governance', badgeText: 'Arch' },
      '03c-tech-nodejs-payments-testing.md': { title: 'API Contracts, SLAs & Reliability Gates', badgeText: 'API' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'High-Leverage PR Review & Mentoring', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Walkthrough — Decomposing Async Bottleneck', badgeText: 'Async' },
      '04b-live-coding-data-state-analytics.md': { title: 'Walkthrough — Telemetry & Guardrails', badgeText: 'State' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Walkthrough — Zero-Downtime Migration', badgeText: 'Mig' },
      '05-system-design-fintech-saas.md': { title: 'Multi-Team Platform Architecture Case', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Staff+ Leveling & Compensation Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Principal Consultant Rate (70–90€/h)', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Tech Lead / Staff Engineer', 'High-Scale SaaS Architecture', '70–90 €/h / €120k+', [
      ['Aurora Payments EU', 'Staff Tech Lead — Core Checkout Platform', 'High-conversion merchant checkout & multi-team web/API platform', [
        'Author pragmatic RFCs, align 4 squads on clean service/API boundaries, and eliminate systemic bottlenecks',
        'Multiply senior engineers via architectural reviews, observability standards, and hands-on prototyping'
      ]],
      ['MetricGrid Cloud', 'Technical Lead — Growth & Platform', 'Experimentation & telemetry SaaS serving 40M daily events', [
        'Lead migration off legacy bottlenecks into modular, well-tested domains without halting feature velocity'
      ]],
      ['NexusPay SaaS', 'Principal Product Engineer (Remote)', 'Merchant onboarding & real-time risk workflows', [
        'Bridge Product strategy and architecture execution while setting CI/CD and performance bars'
      ]]
    ])
  },
  pm: {
    label: 'Product Manager / Group PM',
    category: 'product',
    titleKeywords: ['product manager', 'senior pm', 'group pm', 'group product manager', 'head of product', 'vp product'],
    keywords: ['prd', 'product discovery', 'north star', 'retention', 'activation', 'rice', 'funnel', 'a/b test', 'roadmap', 'monetization', 'customer interviews'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Product Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Product Leadership Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CPO / Founder — Product Sense Chemistry', badgeText: 'CPO' },
      '02-behavioral-leadership-star.md': { title: 'Saying No to Executives & Impact STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'VP Growth — Activation, Churn & LTV', badgeText: 'Growth' },
      '03-technical-deep-dive-architecture.md': { title: 'Product Metrics, Funnels & Experimentation', badgeText: 'KPIs' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Technical Fluency (APIs, Latency, Scope)', badgeText: 'Tech' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Pricing, Packaging & Monetization Trade-Offs', badgeText: 'Price' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Onboarding Conversion Drop Root-Cause', badgeText: 'Funnel' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Live Case — Improve Retention by 15%', badgeText: 'Case' },
      '04b-live-coding-data-state-analytics.md': { title: 'Live Case — RICE Prioritization Conflict', badgeText: 'RICE' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Live Case — B2B Self-Serve Expansion PRD', badgeText: 'PRD' },
      '05-system-design-fintech-saas.md': { title: '0-to-1 Product Strategy & Ecosystem Case', badgeText: 'Strat' },
      '06-salary-contract-negotiation.md': { title: 'Senior/Group PM Band & Equity Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Senior Product Consultant Scope Terms', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Senior Product Manager', 'PLG SaaS & Fintech', '€95k–€140k + Equity', [
      ['PulseFlow SaaS', 'Senior Product Manager — Activation & PLG', 'Self-serve B2B onboarding, experimentation & monetization funnel', [
        'Own North Star activation metrics, run continuous customer discovery interviews, and author outcome-focused PRDs',
        'Partner with Engineering & Design to run high-velocity A/B experiments lifting trial-to-paid conversion'
      ]],
      ['KlarPay Checkout EU', 'Group Product Manager — Merchant Experience', 'Checkout conversion optimization & multi-currency payment methods', [
        'Lead roadmap trade-offs across 3 squads balancing enterprise requests, compliance, and core conversion ROI'
      ]],
      ['SignalDesk AI', 'Principal Product Manager (AI Workflows)', 'B2B AI copilot & automated analytics dashboards', [
        'Define pricing tiers, evaluation metrics, and 0-to-1 go-to-market launches with Sales & CS'
      ]]
    ])
  },
  po: {
    label: 'Product Owner / Agile Delivery',
    category: 'product',
    titleKeywords: ['product owner', 'senior po', 'agile product owner', 'scrum master', 'delivery lead'],
    keywords: ['backlog', 'sprint planning', 'user stories', 'acceptance criteria', 'refinement', 'velocity', 'epic splitting', 'jira', 'scrum', 'kanban'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Agile/Product Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Product Owner Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Head of Product — Delivery Alignment', badgeText: 'HoP' },
      '02-behavioral-leadership-star.md': { title: 'Stakeholder Pressure & Backlog STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Business Sponsor — Value vs Effort ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Backlog Refinement & Epic Splitting', badgeText: 'Backlog' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Acceptance Criteria, Edge Cases & QA Sync', badgeText: 'AC' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Cross-Team Dependencies & API Sequencing', badgeText: 'Deps' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Urgent Production Bug vs Sprint Goal Triage', badgeText: 'Triage' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Live Case — Splitting a Bloated Epic Cleanly', badgeText: 'Split' },
      '04b-live-coding-data-state-analytics.md': { title: 'Live Case — Sprint Capacity Shock Rescue', badgeText: 'Sprint' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Live Case — Writing Sharp Gherkin Stories', badgeText: 'Story' },
      '05-system-design-fintech-saas.md': { title: 'Multi-Squad Quarterly Release Planning', badgeText: 'Plan' },
      '06-salary-contract-negotiation.md': { title: 'Senior PO Compensation & Scope Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Remote PO Day-Rate Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Senior Product Owner', 'Fintech & Enterprise Agile', '€75k–€105k', [
      ['NordicBank Digital', 'Senior Product Owner — Core Payments Squad', 'Customer payment flows, compliance updates & API integrations', [
        'Own and prioritize a healthy, dependency-mapped backlog with crystal-clear Acceptance Criteria (Given/When/Then)',
        'Facilitate sprint goals with engineers, QA, and compliance stakeholders while shielding teams from mid-sprint thrash'
      ]],
      ['FleetTrack SaaS', 'Technical Product Owner — Platform APIs', 'Developer portal, webhooks, and enterprise ERP connectors', [
        'Translate partner workflows into sliceable MVP increments and measurable release milestones'
      ]],
      ['CareBridge EU', 'Agile Product Owner', 'Healthcare scheduling & multi-tenant billing platform', [
        'Run structured refinement, triage production defects against SLAs, and drive predictable sprint outcomes'
      ]]
    ])
  },
  design: {
    label: 'Product / UX Designer',
    category: 'design',
    titleKeywords: ['product designer', 'ux designer', 'ui/ux designer', 'head of design', 'design lead', 'staff designer'],
    keywords: ['figma', 'design system', 'user research', 'usability testing', 'wireframe', 'prototype', 'wcag', 'accessibility', 'design tokens', 'heuristic'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Design Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Product Design Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Head of Design — Craft Chemistry Call', badgeText: 'Lead' },
      '02-behavioral-leadership-star.md': { title: 'Design vs Eng Trade-Offs STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'PM — UX Conversion & Research ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Design Systems, Tokens & Figma->Code', badgeText: 'Tokens' },
      '03b-tech-angular-nx-rxjs.md': { title: 'WCAG Accessibility & Responsive Edge Cases', badgeText: 'A11y' },
      '03c-tech-nodejs-payments-testing.md': { title: 'User Research, Surveys & Usability Metrics', badgeText: 'UXR' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Live UX Critique & Checkout Friction Audit', badgeText: 'Critique' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Whiteboard — Redesigning Complex Onboarding', badgeText: 'Flow' },
      '04b-live-coding-data-state-analytics.md': { title: 'Whiteboard — Error, Empty & Loading States', badgeText: 'States' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Whiteboard — Multi-Step Mobile Form UX', badgeText: 'Mobile' },
      '05-system-design-fintech-saas.md': { title: 'Multi-Product Design System Architecture', badgeText: 'Sys' },
      '06-salary-contract-negotiation.md': { title: 'Senior/Staff Designer Comp Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Remote Design Contract Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Senior Product Designer', 'B2B SaaS & Design Systems', '€80k–€115k', [
      ['Atlas Workspace EU', 'Senior Product Designer — Core Flows', 'Collaborative B2B SaaS workspace & tokenized design system', [
        'Lead end-to-end UX from discovery interviews and prototypes in Figma to pixel-accurate dev handoff',
        'Elevate WCAG AA accessibility, micro-interactions, and measurable self-serve task completion rates'
      ]],
      ['FinPay Consumer', 'Lead UX / Growth Designer', 'Mobile-first checkout and card onboarding flows', [
        'Run weekly usability tests, reduce drop-offs in KYC screens, and scale shared design components'
      ]],
      ['DataCanvas SaaS', 'Staff Design Systems Designer', 'Complex data visualization & builder UI foundations', [
        'Own design token governance across web products alongside frontend platform engineers'
      ]]
    ])
  },
  data: {
    label: 'Data / ML / Analytics Engineering',
    category: 'data',
    titleKeywords: ['data engineer', 'data scientist', 'ml engineer', 'machine learning', 'analytics engineer', 'head of data', 'ai engineer'],
    keywords: ['dbt', 'snowflake', 'bigquery', 'spark', 'airflow', 'sql', 'mlops', 'feature store', 'causal inference', 'evals', 'pytorch', 'embeddings'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Data/AI Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Data & ML Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'Head of Data — Business Impact Call', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Stakeholder Trust & Bad Data STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'PM — Experimentation & Model ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'Warehouse Modeling, dbt & Query Cost', badgeText: 'SQL' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Streaming, Spark, Airflow & Backfills', badgeText: 'ETL' },
      '03c-tech-nodejs-payments-testing.md': { title: 'ML Evals, Model Drift & Feature Stores', badgeText: 'ML' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Schema Drift & Broken Metric Triage', badgeText: 'Drift' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Window Functions & Dedup', badgeText: 'SQL' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Sample Ratio Mismatch Debug', badgeText: 'A/B' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Batch Inference Pipeline', badgeText: 'MLOps' },
      '05-system-design-fintech-saas.md': { title: 'Real-Time Analytics & AI Feature Platform', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Senior Data/ML Compensation Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Data Consultant Rate Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Senior Data / ML Engineer', 'Modern Data Stack & ML Systems', '€95k–€140k', [
      ['TelemetryPulse EU', 'Senior Analytics & Data Platform Engineer', 'Clickstream ingestion, dbt warehouse, and self-serve BI metrics', [
        'Architect reliable incremental dbt/Snowflake models with strict data-quality contracts and cost alerts',
        'Partner with PMs to guarantee trustworthy A/B experimentation and cohort attribution'
      ]],
      ['RiskGuard AI', 'Staff ML Engineer — Real-Time Scoring', 'Sub-40ms fraud scoring & LLM document extraction pipelines', [
        'Build automated evaluation harnesses, drift monitors, and reproducible feature-store pipelines'
      ]],
      ['MetricLake Cloud', 'Senior Data Scientist — Product Growth', 'Causal inference, churn prediction & pricing elasticity models', [
        'Translate ambiguous business questions into clean experimental designs and executive recommendations'
      ]]
    ])
  },
  security: {
    label: 'Security / AppSec & CISO',
    category: 'security',
    titleKeywords: ['security engineer', 'appsec', 'application security', 'infosec', 'ciso', 'head of security', 'cloud security'],
    keywords: ['owasp', 'threat modeling', 'pentest', 'ssrf', 'csrf', 'zero trust', 'iam', 'soc2', 'iso27001', 'kms', 'siem', 'vulnerability'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Security Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Cyber / Sec Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'CISO / VP Infra — Risk Pragmatism', badgeText: 'CISO' },
      '02-behavioral-leadership-star.md': { title: 'Saying No Safely & Dev Empathy STAR', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Enterprise Trust & SOC2 Deal Enabler', badgeText: 'Trust' },
      '03-technical-deep-dive-architecture.md': { title: 'OAuth2/OIDC, Tenant Isolation & Secrets', badgeText: 'Auth' },
      '03b-tech-angular-nx-rxjs.md': { title: 'CI/CD Supply Chain, SAST & Containers', badgeText: 'Supply' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Cloud IAM, KMS & Audit Logging', badgeText: 'IAM' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Threat Modeling & SSRF/XSS Code Review', badgeText: 'Threat' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Scenario — Active Credential Leak Response', badgeText: 'IR' },
      '04b-live-coding-data-state-analytics.md': { title: 'Scenario — Fixing Multi-Tenant Auth Bypass', badgeText: 'IDOR' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Scenario — Hardening Webhook Verification', badgeText: 'HMAC' },
      '05-system-design-fintech-saas.md': { title: 'Zero-Trust SaaS & Key Management Design', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Senior Security Comp & Scope Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU AppSec Advisory Rate Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Senior Application / Cloud Security Engineer', 'Regulated SaaS & Fintech Trust', '€100k–€145k', [
      ['VaultPay EU', 'Senior Product & AppSec Engineer', 'Multi-tenant fintech APIs, OAuth2, and PCI/SOC2 compliance', [
        'Run pragmatic threat modeling in design reviews, automate SAST/DAST in CI, and harden auth/tenant boundaries',
        'Partner with engineering squads to fix high-risk findings quickly without slowing releases'
      ]],
      ['ShieldCloud Infra', 'Staff Cloud Security Architect', 'Zero-trust Kubernetes & AWS/GCP IAM governance', [
        'Architect workload identity, KMS encryption envelopes, and rapid incident response automation'
      ]],
      ['TrustLayer SaaS', 'Head of Security / vCISO', 'Enterprise vendor questionnaires, ISO27001 & governance', [
        'Turn security posture into an enterprise sales accelerator with clear executive risk reporting'
      ]]
    ])
  },
  qa: {
    label: 'QA / SDET & Test Automation',
    category: 'engineering',
    titleKeywords: ['qa', 'sdet', 'quality assurance', 'test automation', 'quality engineer'],
    keywords: ['playwright', 'cypress', 'selenium', 'restassured', 'appium', 'testng', 'junit', 'pytest', 'k6', 'jmeter', 'postman', 'bug triage', 'regression'],
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
    fakeJobs: makeFakeJobs('Senior QA Automation / SDET Engineer', 'High-Volume Cloud Reliability', '55–70 €/h', [
      ['NordicPay Systems', 'Senior QA Automation / SDET Engineer', 'High-volume payments & checkout reliability across Web + APIs', [
        'Architect parallel E2E & API regression suites integrated into pull-request CI gates',
        'Eliminate flaky tests, establish synthetic test-data factories, and enforce SLAs before release'
      ]],
      ['ClearGrid SaaS', 'Staff Quality Engineer — Release Velocity', 'Multi-tenant B2B cloud platform with daily deployments', [
        'Own release quality metrics, defect escape rate dashboards, and root-cause triage rituals'
      ]],
      ['Veloce Cloud EU', 'Lead QA Engineer (Remote Contract)', 'Regulated EU enterprise SaaS needing auditable QA governance', [
        'Lead test strategy across web, REST/GraphQL services, and third-party webhook flows'
      ]]
    ])
  },
  java: {
    label: 'Java / JVM Backend',
    category: 'engineering',
    titleKeywords: ['java developer', 'java engineer', 'spring boot developer', 'backend engineer (java)'],
    keywords: ['java', 'spring boot', 'spring', 'hibernate', 'jpa', 'maven', 'gradle', 'jvm', 'kafka', 'mockito', 'junit', 'kotlin', 'quarkus'],
    slots: {
      '01-hr-recruiter-screening.md': { title: 'Internal Backend Talent Partner', badgeText: 'HR' },
      '01b-hr-agency-headhunter.md': { title: 'EU Java/Cloud Agency Headhunter', badgeText: 'EU' },
      '01c-hr-founder-vp-chemistry.md': { title: 'VP Engineering — Backend Ownership', badgeText: 'VP' },
      '02-behavioral-leadership-star.md': { title: 'Engineering Manager — STAR Incidents', badgeText: 'STAR' },
      '02b-behavioral-product-and-growth.md': { title: 'Product Director — Reliability & SLA ROI', badgeText: 'ROI' },
      '03-technical-deep-dive-architecture.md': { title: 'JVM Memory, GC & High Throughput', badgeText: 'JVM' },
      '03b-tech-angular-nx-rxjs.md': { title: 'Spring Boot, DI, Transactions & JPA', badgeText: 'Spring' },
      '03c-tech-nodejs-payments-testing.md': { title: 'Kafka, Idempotency & Testcontainers', badgeText: 'Kafka' },
      '03d-tech-bug-triage-and-pr-review.md': { title: 'Deadlock Triage, N+1 & PR Review', badgeText: 'PR' },
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Concurrency & Futures', badgeText: 'Async' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Streams & Aggregation', badgeText: 'Stream' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Rate Limiter & Cache', badgeText: 'Cache' },
      '05-system-design-fintech-saas.md': { title: 'Distributed Ledger & Event-Driven Systems', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Senior/Staff Promotion Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU B2B Rate & Contract Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Senior Java / Spring Boot Engineer', 'Distributed Settlement Systems', '60–75 €/h', [
      ['EuroLedger Financial', 'Senior Java / Spring Boot Backend Engineer', 'High-throughput settlement APIs & Kafka pipelines', [
        'Design resilient microservices in Java 21 + Spring Boot with strict transactional integrity',
        'Eliminate JPA N+1 bottlenecks, tune JVM heap/GC telemetry, and ensure idempotent consumers'
      ]],
      ['FreightPulse Logistics', 'Staff JVM Platform Engineer', 'Real-time EU shipment tracking & distributed scheduling', [
        'Architect high-concurrency routing and pricing engines using Kafka, Redis, and PostgreSQL'
      ]],
      ['KronoHealth Tech', 'Senior Java / Cloud Engineer (EU Remote)', 'Healthcare interoperability APIs & audit workflows', [
        'Own service observability, zero-downtime schema migrations, and OAuth2/JWT security layers'
      ]]
    ])
  },
  dotnet: {
    label: '.NET / C# Engineering',
    category: 'engineering',
    titleKeywords: ['.net developer', '.net engineer', 'c# developer', 'c# engineer'],
    keywords: ['c#', '.net', 'dotnet', 'asp.net', 'entity framework', 'ef core', 'linq', 'blazor', 'sql server', 'mediatr', 'xunit', 'nunit', 'wpf'],
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
    fakeJobs: makeFakeJobs('Senior .NET 8 / C# Engineer', 'Azure & Enterprise Fintech', '60–75 €/h', [
      ['NorthStar Treasury', 'Senior .NET 8 / C# Backend Engineer', 'Cloud-native B2B invoicing & Azure Service Bus orchestration', [
        'Build low-latency ASP.NET Core Web APIs using Clean Architecture, CQRS, and EF Core',
        'Optimize SQL Server queries, memory allocations, and automated xUnit integration suites'
      ]],
      ['GridScale Energy EU', 'Lead C# / Azure Full-Stack Developer', 'Real-time smart-meter telemetry & customer portal', [
        'Modernize legacy .NET Framework modules to .NET 8 containers with zero downtime'
      ]],
      ['FinBridge Solutions', 'Principal .NET Solutions Engineer', 'Enterprise banking connectors & compliance auditing', [
        'Design resilient idempotent payment gateways and audit-logged event stores'
      ]]
    ])
  },
  php: {
    label: 'PHP / Laravel & Symfony',
    category: 'engineering',
    titleKeywords: ['php developer', 'laravel developer', 'symfony developer'],
    keywords: ['php', 'laravel', 'symfony', 'composer', 'eloquent', 'doctrine', 'phpunit', 'pest', 'wordpress', 'magento', 'lumen'],
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
    fakeJobs: makeFakeJobs('Senior PHP 8 / Laravel Engineer', 'SaaS & Commerce Platforms', '55–70 €/h', [
      ['CartFlow Commerce', 'Senior PHP 8 / Laravel Platform Engineer', 'High-traffic EU subscriptions & billing webhooks', [
        'Architect clean domain modules in PHP 8.3 + Laravel/Symfony with PHPStan & Pest coverage',
        'Resolve MySQL locking bottlenecks and tune Redis Horizon workers'
      ]],
      ['BookingNest Europe', 'Staff Backend Engineer (Symfony / PHP)', 'Distributed hospitality reservation engine & APIs', [
        'Decompose legacy monolith workflows into reliable queued jobs and versioned APIs'
      ]],
      ['DocuVault EU', 'Senior Full-Stack Laravel Engineer', 'Document automation & e-signature SaaS', [
        'Build secure RBAC APIs and PDF processing pipelines'
      ]]
    ])
  },
  flutter: {
    label: 'Flutter / Dart Mobile',
    category: 'engineering',
    titleKeywords: ['flutter developer', 'mobile engineer', 'ios developer', 'android developer'],
    keywords: ['flutter', 'dart', 'riverpod', 'bloc', 'cubit', 'getx', 'pub.dev', 'android', 'ios', 'platform channel', 'firebase', 'mobile'],
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
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Streams & Isolates', badgeText: 'Async' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Offline Cache & Sync', badgeText: 'State' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Custom Slivers & Keys', badgeText: 'UI' },
      '05-system-design-fintech-saas.md': { title: 'Offline-First Mobile App Architecture', badgeText: 'Mobile' },
      '06-salary-contract-negotiation.md': { title: 'Internal Senior Mobile Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Mobile Contract Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Senior Flutter / Mobile Engineer', 'Consumer Fintech & Health Apps', '60–75 €/h', [
      ['PocketBank EU', 'Senior Flutter / Dart Mobile Engineer', 'Consumer fintech wallet with instant SEPA & biometrics', [
        'Build modular Flutter features with BLoC/Riverpod and 99.9% crash-free stability',
        'Profile shader compilation, list jank, and bridge Swift/Kotlin MethodChannels cleanly'
      ]],
      ['FitPulse Health', 'Lead Cross-Platform Mobile Developer', 'BLE wearable syncing & offline workout analytics', [
        'Architect local SQLite sync queues and smooth custom-painter charts at 60fps'
      ]],
      ['DeliverNow Retail', 'Senior Flutter Architect (Remote)', 'Real-time courier & live map tracking mobile suite', [
        'Optimize battery usage, background geolocation streams, and multi-flavor CI builds'
      ]]
    ])
  },
  python: {
    label: 'Python / Backend & AI',
    category: 'engineering',
    titleKeywords: ['python developer', 'python engineer', 'fastapi developer', 'django developer'],
    keywords: ['python', 'fastapi', 'django', 'flask', 'sqlalchemy', 'celery', 'pytest', 'asyncio', 'pandas', 'langchain', 'rag'],
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
      '04-live-coding-anti-freeze-trainer.md': { title: 'Anti-Freeze — Async Generators & Locks', badgeText: 'def()' },
      '04b-live-coding-data-state-analytics.md': { title: 'Anti-Freeze — Data Pipelines & Retries', badgeText: 'ETL' },
      '04c-live-coding-widgets-dom-maps.md': { title: 'Anti-Freeze — Caching & Rate Limits', badgeText: 'API' },
      '05-system-design-fintech-saas.md': { title: 'Scalable Python API & AI/Worker System', badgeText: 'SYS' },
      '06-salary-contract-negotiation.md': { title: 'Internal Promotion Review', badgeText: 'Comp' },
      '06b-negotiation-eu-b2b-contracts.md': { title: 'EU Contract Rate Negotiation', badgeText: 'Offer' }
    },
    fakeJobs: makeFakeJobs('Senior Python / FastAPI Engineer', 'APIs & AI Orchestration', '60–80 €/h', [
      ['SignalForge AI', 'Senior Python / FastAPI Backend Engineer', 'Low-latency ingestion APIs & LLM evaluation pipelines', [
        'Design typed FastAPI + Pydantic v2 services backed by PostgreSQL, Redis, and Celery/ARQ',
        'Eliminate sync blocking on the asyncio event loop and enforce strict pytest CI coverage'
      ]],
      ['LedgerMetrics EU', 'Staff Python Data & API Engineer', 'Automated financial reporting & reconciliation platform', [
        'Optimize batch ETL jobs, database partitioning, and API latency SLAs'
      ]],
      ['CloudDoc Automation', 'Senior Django / Platform Engineer', 'Enterprise workflow SaaS & partner webhook integrations', [
        'Refactor high-load ORM queries and build idempotent webhooks'
      ]]
    ])
  },
  devops: {
    label: 'DevOps / SRE & Cloud Platform',
    category: 'engineering',
    titleKeywords: ['devops', 'sre', 'site reliability engineer', 'platform engineer', 'cloud architect'],
    keywords: ['kubernetes', 'k8s', 'terraform', 'aws', 'gcp', 'docker', 'helm', 'ci/cd', 'prometheus', 'grafana', 'ansible', 'linux'],
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
    fakeJobs: makeFakeJobs('Senior Site Reliability Engineer', 'Multi-Region Kubernetes & Cloud', '65–85 €/h', [
      ['ScaleMesh Cloud', 'Senior Site Reliability / Platform Engineer', 'Multi-region Kubernetes serving EU fintech traffic (99.99% SLA)', [
        'Manage reusable Terraform AWS/GCP infrastructure, Helm GitOps pipelines, and ArgoCD rollouts',
        'Drive MTTR down via Prometheus/Grafana/OpenTelemetry alerting and cut cloud compute spend'
      ]],
      ['SecureVault Infrastructure', 'Lead DevSecOps Engineer', 'Zero-trust CI/CD platforms & OIDC workload identity', [
        'Harden supply-chain signing and zero-downtime blue/green releases'
      ]],
      ['VervePayments EU', 'Principal Cloud Reliability Engineer', 'High-availability payment gateways & DR', [
        'Architect active-active failover, database replication, and chaos game-days'
      ]]
    ])
  },
  frontend: {
    label: 'Frontend / Full-Stack JS/TS',
    category: 'engineering',
    titleKeywords: ['frontend engineer', 'frontend developer', 'full-stack engineer', 'react developer', 'angular developer'],
    keywords: ['angular', 'react', 'vue', 'svelte', 'typescript', 'javascript', 'next.js', 'rxjs', 'ngrx', 'redux', 'css', 'lit', 'vite'],
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
    fakeJobs: makeFakeJobs('Senior Frontend / Full-Stack Engineer', 'Web Apps & Embedded SDKs', '55–70 €/h', [
      ['FinPulse Checkout', 'Senior Frontend / Full-Stack Engineer', 'High-conversion merchant checkout & analytics dashboards', [
        'Optimize bundle footprint, LCP/INP performance, and reactive state management across apps',
        'Build resilient BFF integrations, accessibility-first components, and automated Playwright gates'
      ]],
      ['Atlas Workspace EU', 'Staff UI Platform Engineer', 'Collaborative B2B design system & micro-frontend workspace', [
        'Lead monorepo governance, shared component library APIs, and rendering performance'
      ]],
      ['MetricStream SaaS', 'Tech Lead — Product Growth & UX', 'Self-serve onboarding funnels & experiment-driven SaaS growth', [
        'Own activation telemetry, A/B experimentation architecture, and cross-functional mentoring'
      ]]
    ])
  },
  general: {
    label: 'Senior Software Engineering',
    category: 'engineering',
    titleKeywords: ['software engineer', 'developer', 'programmer'],
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
    fakeJobs: makeFakeJobs('Senior Software Engineer', 'B2B Cloud Platforms', '55–70 €/h', [
      ['Aurora Cloud Systems', 'Senior Software Engineer', 'High-reliability B2B SaaS platform & partner integrations', [
        'Own end-to-end delivery of mission-critical services, automated testing, and telemetry',
        'Partner with product & design to translate business goals into clean architecture'
      ]],
      ['EuroFin Platform', 'Staff / Lead Product Engineer', 'Distributed EU fintech infrastructure & developer experience', [
        'Drive technical standards, PR reviews, latency optimization, and cross-team architecture'
      ]],
      ['Nexus Remote Tech', 'Senior Full-Stack Consultant (Remote)', 'Modernization of core workflows & API integrations', [
        'Eliminate reliability bottlenecks and ship measurable performance & quality improvements'
      ]]
    ])
  },
  ...EXTRA_ROLE_ARCHETYPES
};

export function getRoleCategory(archKey = 'general') {
  return (ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general).category || 'engineering';
}

export function getTopicUiLabels(archKey = 'general') {
  return resolveTopicUiLabelsForCategory(getRoleCategory(archKey), archKey);
}

export function detectRoleArchetype(rawText = '', profile = {}) {
  const headlineText = `${profile?.headline || ''} ${(profile?.coreStack || []).join(' ')}`.toLowerCase();
  const topSnippet = String(rawText || '').slice(0, 650).toLowerCase();
  const bodyText = String(rawText || '').toLowerCase();

  let bestKey = 'general';
  let bestScore = 0;

  for (const [key, cfg] of Object.entries(ROLE_ARCHETYPES)) {
    if (key === 'general') continue;
    let score = 0;
    for (const tk of cfg.titleKeywords || []) {
      const escaped = tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (re.test(headlineText)) score += 16;
      else if (re.test(topSnippet)) score += 9;
      else if (re.test(bodyText)) score += 3;
    }
    for (const kw of cfg.keywords || []) {
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
