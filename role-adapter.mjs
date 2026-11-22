// Universal multi-role CV & career-track adapter: adapts interviewers, fake job postings,
// Daily Path drills, and live call directives to ANY tech company role
// (CEO, COO, CTO, EM, Tech Lead, PM, PO, Design, Data/ML, Security, QA, Java, .NET, PHP, Python, DevOps, Frontend).

import {
  ROLE_ARCHETYPES,
  detectRoleArchetype,
  getRoleCategory,
  getLeadershipTier,
  EXECUTIVE_PATH_BLUEPRINT,
  MANAGER_PATH_BLUEPRINT
} from './shared/role-archetypes.mjs';
import { formatKnowledgeForInterviewer } from './shared/role-knowledge.mjs';
import { formatTechStacksForInterviewer } from './shared/kb-tech-stacks.mjs';

export { detectRoleArchetype };

export function resolveEffectiveArchetype(activeCv, targetRoleTrack = 'auto') {
  const track = String(targetRoleTrack || 'auto').trim();
  if (track && track !== 'auto' && Object.hasOwn(ROLE_ARCHETYPES, track)) {
    return track;
  }
  return detectRoleArchetype(activeCv?.rawText || '', activeCv?.profile || {});
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
      (stackTag && getRoleCategory(archKey) === 'engineering' ? `Focus on ${stackTag} & ${arch.label}` : `${blueprint.title} (${arch.label})`);
    out[agentId] = {
      title: String(title).trim().slice(0, 56),
      badgeText: String(badgeText).trim().slice(0, 8),
      focusHint: String(focusHint).trim().slice(0, 140)
    };
  }
  return out;
}

export function getAdaptedAgents(baseAgents, activeCv, targetRoleTrack = 'auto') {
  const track = String(targetRoleTrack || 'auto').trim();
  const hasExplicitOverride = Boolean(track && track !== 'auto' && Object.hasOwn(ROLE_ARCHETYPES, track));
  if (!hasExplicitOverride && (!activeCv || activeCv.id === 'cv-baseline-1')) return baseAgents;

  const effArch = resolveEffectiveArchetype(activeCv, track);
  const tier = getLeadershipTier(effArch);
  const overrides =
    !hasExplicitOverride && activeCv?.agentOverrides && Object.keys(activeCv.agentOverrides).length
      ? activeCv.agentOverrides
      : normalizeAgentOverrides(null, effArch, activeCv?.profile || {}, activeCv?.rawText || '');

  return baseAgents.map((ag) => {
    const ov = overrides[ag.id] || {};
    const execVisuals = tier === 'executive'
      ? {
          persona: 'business',
          headset: 'none',
          glasses: ag.glasses === 'tech' ? 'executive' : ag.glasses,
          tie: ag.gender === 'male'
        }
      : tier === 'manager'
        ? {
            persona: 'business',
            headset: 'none',
            glasses: ag.glasses === 'tech' ? 'round' : ag.glasses
          }
        : {};
    return {
      ...ag,
      ...execVisuals,
      title: ov.title || ag.title,
      badgeText: ov.badgeText || ag.badgeText,
      focusHint: ov.focusHint || ''
    };
  });
}

function buildFallbackFakeJds(archKey, profile = {}) {
  const arch = ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general;
  const cat = arch.category || 'engineering';
  const stack = (profile?.coreStack || []).slice(0, 6);
  const effectiveSkills = cat === 'executive' || cat === 'product' || cat === 'design'
    ? (arch.keywords || []).slice(0, 5)
    : (stack.length ? stack : (arch.keywords || []).slice(0, 5));
  const compFallback = profile?.targetCompensation || 'Competitive EU Remote Band';

  return arch.fakeJobs.map((tpl, idx) => ({
    id: `fake-jd-${idx + 1}`,
    title: `${tpl.roleTitle} — ${tpl.company}`,
    company: tpl.company,
    roleTitle: tpl.roleTitle,
    summary: `Tailored ${arch.label} drill position for ${profile?.candidateName || 'Candidate'}. Domain: ${tpl.domain}.`,
    stack: effectiveSkills,
    compensation: tpl.compensation || compFallback,
    responsibilities: tpl.responsibilities,
    requirements: [
      `${profile?.yearsExperience || '5+ years'} proven ownership and track record aligned with ${arch.label}`,
      'High-clarity executive & cross-functional C1 English communication under pressure'
    ]
  }));
}

export function normalizeGeneratedJds(rawJds, profile = {}, rawText = '', archOverride = null) {
  const archKey = archOverride && Object.hasOwn(ROLE_ARCHETYPES, archOverride)
    ? archOverride
    : detectRoleArchetype(rawText, profile);
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
**Company:** ${jd.company}
Compensation / Engagement: ${jd.compensation || 'Competitive Remote'}
Core Capabilities: ${(jd.stack || []).join(', ')}

## Context
${jd.summary || ''}

## Responsibilities
${resp}

## Key Requirements
${reqs}`.trim();
}

export function getActiveJobDescriptions(staticJds, activeCv, targetRoleTrack = 'auto') {
  const track = String(targetRoleTrack || 'auto').trim();
  const hasExplicitOverride = Boolean(track && track !== 'auto' && Object.hasOwn(ROLE_ARCHETYPES, track));

  if (hasExplicitOverride) {
    const roleJds = buildFallbackFakeJds(track, activeCv?.profile || {});
    const extraCustom = (Array.isArray(activeCv?.generatedJds) ? activeCv.generatedJds : [])
      .filter((j) => !/^fake-jd-[123]$/.test(String(j?.id || '')));
    return [...extraCustom, ...roleJds].map((jd) => ({
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
  const jds = normalizeGeneratedJds(null, profile, '', archKey);
  const slots = (ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general).slots;
  const input = Array.isArray(rawDays) ? rawDays : [];
  const archLabel = (ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general).label;
  const cat = getRoleCategory(archKey);
  const tier = getLeadershipTier(archKey);
  const tierTemplate = tier === 'executive'
    ? EXECUTIVE_PATH_BLUEPRINT
    : tier === 'manager'
      ? MANAGER_PATH_BLUEPRINT
      : baseMorningPath;
  const stackSample = cat === 'engineering' || cat === 'data' || cat === 'security'
    ? ((profile?.coreStack || []).slice(0, 3).join(', ') || archLabel)
    : archLabel;

  return tierTemplate.map((fallback, idx) => {
    const item = input[idx] || {};
    const byTopic = baseAgents.find((a) => a.topic.toLowerCase() === String(item.topic || '').toLowerCase());
    const agent = validAgents.has(item.agent) ? item.agent : (byTopic?.id || fallback.agent);
    const meta = baseAgents.find((a) => a.id === agent);
    const slotTitle = slots[agent]?.title || fallback.title;
    const rawTitle = String(item.title || '').trim();
    const safeTitle = (rawTitle || (tier === 'ic' ? slotTitle : fallback.title)).slice(0, 48);
    const jdObj = jds[idx % jds.length];
    return {
      day: idx + 1,
      title: safeTitle,
      topic: meta?.topic || item.topic || fallback.topic,
      agent,
      jd: jdObj.id,
      focus: String(item.focus || fallback.focus || `Drill ${slotTitle} focused on ${stackSample} scenarios & metrics.`).trim()
    };
  });
}

export function adaptMorningPathForTrack(baseMorningPath, activeCv, baseAgents, targetRoleTrack = 'auto') {
  const track = String(targetRoleTrack || 'auto').trim();
  const hasExplicitOverride = Boolean(track && track !== 'auto' && Object.hasOwn(ROLE_ARCHETYPES, track));
  if (!hasExplicitOverride) {
    if (activeCv?.dailyPath?.length) return activeCv.dailyPath;
    const detectedArch = resolveEffectiveArchetype(activeCv, 'auto');
    return getLeadershipTier(detectedArch) === 'ic'
      ? baseMorningPath
      : normalizeCvDailyPath(null, baseMorningPath, baseAgents, detectedArch, activeCv?.profile || {});
  }
  return normalizeCvDailyPath(null, baseMorningPath, baseAgents, track, activeCv?.profile || {});
}

export function buildDynamicAgentDirective({ meta, activeCv, companyName = '', archKey = 'general', tier = null, compactMode = false, jdText = '' }) {
  const profile = activeCv?.profile || {};
  const arch = ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general;
  const cat = arch.category || 'engineering';
  const topic = meta?.topic || 'Technical';
  const effTier = tier || (compactMode ? 'small' : 'medium');
  const firstName = String(profile.candidateName || 'Candidate').trim().split(/\s+/)[0] || 'Candidate';
  const stackList = (profile.coreStack || []).slice(0, effTier === 'small' ? 3 : 6).join(', ') || arch.label;
  const achievements = (profile.topAchievements || []).slice(0, effTier === 'small' ? 1 : effTier === 'medium' ? 2 : 4).map((a) => `- ${String(a).slice(0, 120)}`).join('\n');
  const gaps = (profile.gapAreas || []).slice(0, effTier === 'small' ? 1 : 2).map((g) => `- ${String(g).slice(0, 110)}`).join('\n');

  const execGuidance = {
    HR: `Executive calibration screen for ${arch.label}: mandate fit, leadership philosophy, stage comfort, board presence. NEVER quiz coding syntax.`,
    Behavioral: `Investor / Executive stakeholder probing hard calls, org turnarounds, exec conflict, and P&L accountability.`,
    Technical: `Deep ${arch.label} strategy on "${meta?.title || 'Domain Strategy'}": unit economics, operating cadence, and strategic trade-offs. NEVER quiz coding syntax.`,
    'Live Coding': `Executive Live Scenario on "${meta?.title || 'Decision Under Pressure'}": structured trade-off defense (ZERO code).`,
    'System Design': `Multi-Quarter Strategy & Org Design ("${meta?.title || 'Operating Model'}") for ${arch.label}: allocation, bottlenecks, resilience.`,
    Negotiation: `Board Chair / Investor negotiating ${arch.label} scope, equity vesting, performance bonus, and mandate terms.`
  };

  const productDesignGuidance = {
    HR: `Sharp screening call for ${arch.label}: discovery mindset, craft trajectory, stakeholder alignment, comp (${profile.targetCompensation || 'market'}). NO code.`,
    Behavioral: `VP Product / Design Lead probing saying no to execs/Sales, ambiguity ownership, and measurable user/revenue impact.`,
    Technical: `${arch.label} domain mastery on "${meta?.title || 'Core Craft'}": metrics, experimentation, tooling/UX judgment, feasibility & ROI. NO coding syntax.`,
    'Live Coding': `Live Case / UX Critique on "${meta?.title || 'Prioritization & Critique'}": clarify user, metric, and trade-offs step-by-step (ZERO code).`,
    'System Design': `End-to-End Strategy / Design System case ("${meta?.title || 'Strategy & Ecosystem'}"): 0-to-1 framing, monetization/tokens, scale.`,
    Negotiation: `Hiring Director calibrating ${arch.label} scope, band, equity, and comp (${profile.targetCompensation || 'senior market'}).`
  };

  const gtmGuidance = {
    HR: `Executive GTM screen for ${arch.label}: ACV/GTM motion fit, pipeline/quota track record, and OTE. NO coding trivia.`,
    Behavioral: `CEO / CRO probing deal turnarounds, killing failing campaigns, Sales-Product-CS alignment, and forecast honesty.`,
    Technical: `Deep ${arch.label} craft on "${meta?.title || 'GTM & Metrics'}": pipeline math, MEDDPICC / positioning, CAC payback, pricing discipline.`,
    'Live Coding': `Live GTM / Deal Clinic on "${meta?.title || 'Forecast or Funnel Recovery'}": structured buyer diagnosis and corrective levers (ZERO code).`,
    'System Design': `Revenue / Demand Engine Architecture ("${meta?.title || 'GTM Scale'}"): territory design, PLG-to-Enterprise pods, NRR.`,
    Negotiation: `CRO / Comp Partner negotiating Base/OTE split, accelerators, ramp draw, and commercial authority.`
  };

  const solutionsGuidance = {
    HR: `Screening for ${arch.label}: enterprise discovery comfort, pre-sales technical range, customer polish.`,
    Behavioral: `Probing ethical boundary-holding under AE pressure, rescuing broken enterprise demos, and field-to-Product loops.`,
    Technical: `Enterprise integration mastery on "${meta?.title || 'Arch & PoC'}": SAML/OIDC/SCIM, signed webhooks, GDPR/SOC2, API sizing.`,
    'Live Coding': `Live Technical Discovery & PoC Scoping Drill on "${meta?.title || 'Enterprise PoC'}": buyer pain, signed exit criteria, block scope creep.`,
    'System Design': `Enterprise Customer Integration Blueprint ("${meta?.title || 'Client Architecture'}"): security, SLAs, rapid TTFV.`,
    Negotiation: `Calibrating SA/SE Base/Variable (75/25) OTE, quota vs pool structure, and scope.`
  };

  const emGuidance = {
    HR: `EM Leadership screen: team size managed, people vs technical leadership balance, remote/async culture, and comp. NO coding.`,
    Behavioral: `VP Eng probing performance coaching, PIPs, mediating Staff/PM clashes, burnout prevention, and retention.`,
    Technical: `Engineering delivery mastery on "${meta?.title || 'Delivery & Risk'}": DORA/WIP predictability, reliability budgets, technical oversight. NO LeetCode.`,
    'Live Coding': `Live People & Delivery Scenario on "${meta?.title || 'People Scenario'}": retention crisis, scope clash, and coaching judgment (ZERO code).`,
    'System Design': `Org Topology & Scaling Design ("${meta?.title || 'Org Topology'}"): multi-squad ownership, on-call health, career ladders.`,
    Negotiation: `VP Eng calibrating M3/M4 band, headcount authority, equity, and comp.`
  };

  const opsNonCodeGuidance = {
    HR: `${arch.label} screening: org scale, stakeholder impact, operating rigor, and comp/OTE. NO programming questions.`,
    Behavioral: `Probing cross-org escalations, candid pushback, ethical judgment, and measurable retention/delivery impact.`,
    Technical: `${arch.label} mastery on "${meta?.title || 'Core Craft'}": domain metrics, risk governance, and operational playbooks (NO code).`,
    'Live Coding': `Live ${arch.label} Scenario on "${meta?.title || 'Live Case'}": diagnose root cause, sequence immediate containment, and defend trade-offs (ZERO code).`,
    'System Design': `Scalable ${arch.label} Operating Model ("${meta?.title || 'Operating Scale'}"): cross-team cadence, tooling, and SLA resilience.`,
    Negotiation: `Calibrating ${arch.label} seniority band, OTE/bonus structure, authority, and start date.`
  };

  const engTopicGuidance = {
    HR: `HR screen for ${arch.label}: career arc, motivation, collaboration fit, remote setup, comp (${profile.targetCompensation || 'market'}). NEVER quiz code.`,
    Behavioral: `STAR Behavioral & Leadership interview: conflict, ownership, mentoring, and measurable engineering ROI.`,
    Technical: `Deep ${arch.label} grill on "${meta?.title || 'Core Craft'}" (${stackList}): concrete trade-offs, debugging, scalability, and security.`,
    'Live Coding': `Structured Verbal Problem Solving on "${meta?.title || 'Walkthrough'}" (${stackList}): clarifying edge cases and step-by-step reasoning.`,
    'System Design': `Principal System Design drill for ${arch.label} (${stackList}): requirements, bottlenecks, failure modes, and boundaries.`,
    Negotiation: `Hiring Director negotiating ${arch.label} scope, level, and comp (${profile.targetCompensation || 'senior market'}).`
  };

  const activeMap = cat === 'executive'
    ? execGuidance
    : archKey === 'em'
      ? emGuidance
      : cat === 'gtm'
        ? gtmGuidance
        : cat === 'solutions'
          ? solutionsGuidance
          : (cat === 'tpm' || cat === 'csm' || cat === 'people')
            ? opsNonCodeGuidance
            : (cat === 'product' || cat === 'design')
              ? productDesignGuidance
              : engTopicGuidance;

  const kbBlock = formatKnowledgeForInterviewer({ archKey, topic, tier: effTier });
  const stackBlock = formatTechStacksForInterviewer({
    archKey,
    cvText: activeCv?.rawText || '',
    coreStack: profile.coreStack || [],
    jdText,
    topic,
    tier: effTier
  });
  const leadershipTier = getLeadershipTier(archKey);
  const tierPosture = leadershipTier === 'executive'
    ? 'Posture: Peer C-suite mutual due diligence — challenge platitudes calmly with boardroom metrics, never condescend.'
    : (leadershipTier === 'manager' && topic === 'Live Coding')
      ? 'Roleplay: Play the defensive report or pushy stakeholder briefly in character to test empathy + firmness before debriefing rationale.'
      : '';

  if (effTier === 'small') {
    return `ROLE: ${meta?.avatarName || 'Interviewer'}${companyName ? ` @ ${companyName}` : ''} | ${arch.label} (${topic}) | Candidate: ${firstName} (${stackList})
OBJECTIVE: ${activeMap[topic] || activeMap.Technical}
${tierPosture ? `${tierPosture}\n` : ''}${kbBlock}${stackBlock ? `\n${stackBlock}` : ''}`;
  }

  return `# Interviewer Directive (${arch.label}): ${meta?.title || topic}
- Persona: ${meta?.avatarName || 'Interviewer'}${companyName ? ` from ${companyName}` : ''} (${topic}) | Candidate: ${firstName} (${stackList})
- Focus: ${activeMap[topic] || activeMap.Technical}
${tierPosture ? `- ${tierPosture}\n` : ''}${achievements ? `- Highlights:\n${achievements}\n` : ''}${gaps ? `- Probe Gaps:\n${gaps}\n` : ''}- Domain Rule: Stay strictly within ${arch.label} craft and ${topic} scope.

${kbBlock}${stackBlock ? `\n\n${stackBlock}` : ''}`;
}

export function buildCvAnalysisPrompt({ rawText, notes, baseAgents }) {
  const agentDirectory = baseAgents.map((a) => `${a.id} (${a.topic})`).join(', ');
  return `You are an Executive & Engineering Career Strategist preparing candidates for international interviews across ALL IT startup & enterprise roles (CEO, COO, CTO, CFO, CRO/VP Sales, EM, Tech Lead, TPM/Scrum, Solutions Architect, PM, PO, UX/Product Designer, Growth/PMM, Customer Success/TAM, People Ops/HRBP/Recruiter, Data/ML, Security/CISO, QA/SDET, Java, .NET, PHP, Python, Go, Rust, C/C++, iOS Swift/Obj-C, Android Kotlin, React Native/Flutter/Cordova, DevOps, Frontend).
Analyze this uploaded CV carefully and produce:
1. A structured Candidate Profile.
2. Tailored titles for key interviewer tracks matching THIS CV's true discipline & seniority (agentOverrides — remember legacy agent IDs like 03b/04 can represent non-coding Product Case / Exec Scenario / Ops Scaling rounds when the CV is PM/PO/CTO/COO/CEO/Design!).
3. 3 realistic "Fake Job" postings (generatedJds) that fit THIS candidate's exact role, level, and target compensation.
4. A progressive 20-Day Interview Training Path (dailyPath) aligned strictly with THIS CV's track, achievements, and gaps.

UPLOADED CV CONTENT:
${String(rawText || '').slice(0, 7200)}

EXTRA FOCUS NOTES: ${notes || 'International remote/leadership interview preparation tailored strictly to this candidate role.'}

AVAILABLE AGENT FILENAMES (for dailyPath.agent & agentOverrides keys):
${agentDirectory}

Return ONE strict JSON object with EXACTLY these keys:
{
  "candidateName": "Full name from CV",
  "headline": "Candidate's true role headline (e.g. Senior Product Manager / CTO / Tech Lead / QA Engineer)",
  "location": "Location / timezone",
  "yearsExperience": "e.g. 8+ years",
  "targetCompensation": "Realistic comp/rate target inferred from role & seniority",
  "coreStack": ["domain/skill/tool 1", "2", "3", "4", "5", "6"],
  "topAchievements": ["Quantified achievement from CV 1", "Achievement 2", "Achievement 3"],
  "gapAreas": ["Interview trap or gap to drill 1", "Gap 2", "Gap 3"],
  "profilePrompt": "Dense 100-140 word English briefing summarizing this candidate's real companies, metrics, leadership/craft scope, and interview angles.",
  "agentOverrides": {
    "03-technical-deep-dive-architecture.md": {"title": "Role-authentic deep-dive / strategy topic", "badgeText": "ShortTag"},
    "03b-tech-angular-nx-rxjs.md": {"title": "Role-authentic craft/execution topic from CV ONLY (legacy ID; NEVER mention Angular/RxJS unless in CV!)", "badgeText": "Core"},
    "03c-tech-nodejs-payments-testing.md": {"title": "Role-authentic stakeholder/monetization/API topic", "badgeText": "Scope"},
    "03d-tech-bug-triage-and-pr-review.md": {"title": "Role-authentic crisis/funnel/SLA/debug triage", "badgeText": "Triage"},
    "04-live-coding-anti-freeze-trainer.md": {"title": "Role-authentic live case / scenario / problem solving", "badgeText": "Case"},
    "05-system-design-fintech-saas.md": {"title": "Role-authentic strategy/org/system design case", "badgeText": "Scale"}
  },
  "generatedJds": [
    {
      "company": "Realistic fictional company name",
      "roleTitle": "Exact target job title matching CV",
      "summary": "2-sentence overview of company stage, product & mandate",
      "stack": ["capability1", "capability2", "capability3", "capability4"],
      "compensation": "Realistic executive/senior salary, equity, or B2B rate",
      "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
      "requirements": ["Requirement 1", "Requirement 2"]
    }
  ],
  "dailyPath": [
    {
      "day": 1,
      "topic": "HR" | "Technical" | "Live Coding" | "Behavioral" | "System Design" | "Negotiation",
      "title": "Short 3-5 word step title authentic to THIS role",
      "agent": "Exact agent filename from list above",
      "focus": "1-2 sentence drill objective specifically exercising a metric, leadership moment, or case for THIS role"
    }
  ]
}
Include ALL 3 generatedJds and ALL 20 days (day 1..20) in dailyPath.`;
}

export function buildFakeJobPrompt({ profile, rawText, customFocus = '', archKey = 'general' }) {
  const arch = ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general;
  return `Generate 1 fresh, realistic fictional Job Description ("fake job") calibrated for a **${arch.label}** target interview.

CANDIDATE / TARGET CONTEXT:
- Target Track: ${arch.label} (${arch.category})
- Name: ${profile?.candidateName || 'Candidate'}
- Background Headline: ${profile?.headline || arch.label}
- Core Capabilities / Stack: ${(profile?.coreStack || []).join(', ')}
- Achievements: ${(profile?.topAchievements || []).slice(0, 3).join('; ')}
- Target Compensation: ${profile?.targetCompensation || 'Market competitive'}
- Requested Focus: ${customFocus || `Realistic international ${arch.label} mandate with high-stakes decisions`}

CV EXCERPT:
${String(rawText || '').slice(0, 2200)}

Return ONE strict JSON object:
{
  "company": "Distinct realistic fictional company name",
  "roleTitle": "Exact ${arch.label} role title calibrated to seniority",
  "summary": "2 crisp sentences describing product stage, scale, and mission",
  "stack": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "compensation": "Realistic salary, equity, or remote contract band",
  "responsibilities": ["Responsibility 1", "Responsibility 2", "Responsibility 3"],
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"]
}`;
}
