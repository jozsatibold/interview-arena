/**
 * Conversational Pacing & Smooth Topic Transition Helpers
 * Prevents abrupt whiplash (e.g. "How are you?" -> sudden hyper-specific CV ambush)
 * by structuring interviews into Warm-Up -> Broad Intro -> Bridged Exploration -> Smooth Wrap-Up.
 */

import { getRoleCategory, ROLE_ARCHETYPES } from '../shared/role-archetypes.mjs';

/**
 * Remove legacy "How to Start Immediately" sections from static agent markdown prompts
 * so abrupt hardcoded openers do not override the phased warm-up funnel.
 */
export function stripStaticOpenerSection(mdText) {
  return String(mdText || '')
    .replace(/\n##\s+\d+\.\s+How to Start Immediately[\s\S]*$/i, '')
    .trim();
}

/**
 * Resolve the current interview conversation phase and tailored pacing/opener instructions.
 */
export function getTopicScopeContract(topic = 'HR', archKey = 'general') {
  const key = String(topic || 'HR').trim();
  const cat = getRoleCategory(archKey);
  const archLabel = (ROLE_ARCHETYPES[archKey] || ROLE_ARCHETYPES.general).label;

  if (cat === 'executive') {
    const execContracts = {
      HR: {
        allowed: `executive mandate alignment, ${archLabel} career trajectory, board/investor fit, leadership ethos, and target compensation`,
        forbidden: 'NEVER run IC coding quizzes, framework internals, or low-level syntax trivia',
        deflect: 'Politely redirect any low-level coding or off-topic requests back to executive mandate and leadership fit.'
      },
      Behavioral: {
        allowed: 'hard executive calls, org turnarounds, executive conflict, accountability, and strategic leadership impact',
        forbidden: 'NEVER turn this into coding trivia or low-level debugging',
        deflect: 'Steer off-topic or IC-level coding tangents back to executive leadership decisions and outcomes.'
      },
      Technical: {
        allowed: `${archLabel} domain strategy, unit economics/P&L, operating cadence, cross-functional scaling, risk/compliance, and FinOps trade-offs`,
        forbidden: 'NEVER quiz algorithmic coding syntax or trivial UI/ORM trivia',
        deflect: 'Redirect low-level syntax questions back to strategic, financial, or organizational trade-offs.'
      },
      'Live Coding': {
        allowed: `live executive decision scenarios for ${archLabel} (budget cuts, SLA crises, strategic pivots, organizational bottlenecks)`,
        forbidden: 'NEVER ask the candidate to write code or solve LeetCode algorithms',
        deflect: 'Keep the focus strictly on structured executive case reasoning and defensible trade-offs.'
      },
      'System Design': {
        allowed: `multi-year ${archLabel} operating model design, org topology, capital/R&D allocation, and enterprise scale resilience`,
        forbidden: 'NEVER conduct salary negotiation or trivia quizzes',
        deflect: 'Bring discussion back to macro org/system architecture and scaling cadence.'
      },
      Negotiation: {
        allowed: `${archLabel} executive scope, equity/vesting, performance bonus, severance/mandate, and start timeline`,
        forbidden: 'NEVER run operational crises or technical trivia',
        deflect: 'Steer conversation back to executive compensation and mandate terms.'
      }
    };
    return execContracts[key] || execContracts.Technical;
  }

  if (cat === 'product' || cat === 'design') {
    const prodContracts = {
      HR: {
        allowed: `${archLabel} career summary, product/design mindset, cross-functional fit, remote setup, and compensation alignment`,
        forbidden: 'NEVER run coding quizzes, algorithm tests, or deep backend trivia',
        deflect: 'Politely keep the screen focused on product/design role fit and trajectory.'
      },
      Behavioral: {
        allowed: 'stakeholder conflict, saying no to executives, cross-functional leadership with Eng/Sales, ownership, and measurable user/business impact',
        forbidden: 'NEVER turn this into programming quizzes or compensation negotiation',
        deflect: 'Steer back to concrete product/design collaboration stories and outcomes.'
      },
      Technical: {
        allowed: `${archLabel} craft: discovery, North Star/UX metrics, backlog/prioritization, experimentation, accessibility/design systems, and technical feasibility fluency`,
        forbidden: 'NEVER ask the candidate to write code or invert binary trees',
        deflect: 'Redirect pure implementation syntax tangents back to user value, metrics, and scope trade-offs.'
      },
      'Live Coding': {
        allowed: `live ${archLabel} case/critique exercise (clarifying user segment & goal metric, RICE/backlog splitting, edge cases, or UX flow critique)`,
        forbidden: 'NEVER ask the candidate to write programming code',
        deflect: 'Guide the candidate cleanly through structured product/UX case reasoning.'
      },
      'System Design': {
        allowed: `end-to-end ${archLabel} strategy case (0-to-1 launch, monetization/pricing, multi-product design system, or roadmap architecture)`,
        forbidden: 'NEVER drift into HR salary talk or low-level code trivia',
        deflect: 'Keep focus on cohesive product/design strategy and measurable impact.'
      },
      Negotiation: {
        allowed: 'scope, seniority band, equity, compensation, notice period, and start timeline',
        forbidden: 'NEVER run product/design case quizzes during negotiation',
        deflect: 'Steer back to compensation and role scope alignment.'
      }
    };
    return prodContracts[key] || prodContracts.Technical;
  }

  if (cat === 'gtm') {
    const gtmContracts = {
      HR: {
        allowed: `${archLabel} career scope, ACV/GTM motion history, target quota/pipeline impact, remote setup, and OTE expectations`,
        forbidden: 'NEVER ask programming, algorithm, or engineering syntax questions',
        deflect: 'Keep the screen tightly focused on commercial/GTM trajectory and fit.'
      },
      Behavioral: {
        allowed: 'high-stakes deal recovery, killing failing campaigns, cross-org Sales/Product/CS alignment, and accountability',
        forbidden: 'NEVER turn this into coding trivia or OTE contract negotiation',
        deflect: 'Steer back to concrete GTM leadership and revenue outcomes.'
      },
      Technical: {
        allowed: `${archLabel} craft: pipeline coverage math, MEDDPICC, ICP positioning, CAC/LTV payback, attribution, and pricing/give-get levers`,
        forbidden: 'NEVER quiz software code or infrastructure trivia',
        deflect: 'Redirect technical implementation tangents back to buyer impact, pipeline math, and conversion metrics.'
      },
      'Live Coding': {
        allowed: `live ${archLabel} deal/funnel clinic (diagnosing forecast slippage, CAC spike, or 35% discount pressure — NO coding)`,
        forbidden: 'NEVER ask the candidate to write code',
        deflect: 'Guide the candidate strictly through commercial/growth diagnosis and step-by-step action plan.'
      },
      'System Design': {
        allowed: `scalable ${archLabel} revenue engine or demand architecture (territory design, PLG-to-Enterprise funnel, launch tiering)`,
        forbidden: 'NEVER drift into OTE salary negotiation or coding quizzes',
        deflect: 'Refocus on durable GTM systems, org ratios, and compounding net retention.'
      },
      Negotiation: {
        allowed: 'base/variable OTE split, accelerators, ramp draw, budget authority, and start timeline',
        forbidden: 'NEVER run deal clinics or GTM tests during comp negotiation',
        deflect: 'Keep discussion anchored on compensation and commercial mandate.'
      }
    };
    return gtmContracts[key] || gtmContracts.Technical;
  }

  if (cat === 'solutions') {
    const solContracts = {
      HR: {
        allowed: `${archLabel} pre-sales/customer engineering trajectory, enterprise ACV exposure, discovery mindset, and OTE alignment`,
        forbidden: 'NEVER turn HR screen into a live integration architecture whiteboard',
        deflect: 'Keep focus on customer-facing technical bridge fit and logistics.'
      },
      Behavioral: {
        allowed: 'handling AE pressure ethically, rescuing failing enterprise demos, InfoSec escalations, and Product feedback loops',
        forbidden: 'NEVER turn this into low-level algorithm coding',
        deflect: 'Steer back to concrete enterprise customer collaboration stories.'
      },
      Technical: {
        allowed: `${archLabel} architecture: SAML/OIDC SSO, SCIM provisioning, idempotent webhooks, GDPR/SOC2 trust boundaries, and PoC scoping`,
        forbidden: 'NEVER run comp OTE negotiation or LeetCode puzzles',
        deflect: 'Redirect into customer integration feasibility, security trust, and PoC criteria.'
      },
      'Live Coding': {
        allowed: `live ${archLabel} customer discovery & PoC scoping clinic (blocking scope creep while locking pass/fail exit criteria)`,
        forbidden: 'NEVER run disconnected algorithm trivia',
        deflect: 'Keep the candidate inside realistic customer discovery and architecture trade-offs.'
      },
      'System Design': {
        allowed: 'end-to-end enterprise client integration blueprint (SSO, Async Event Sync, EU Data Residency, Failover)',
        forbidden: 'NEVER drift into salary negotiation',
        deflect: 'Focus strictly on customer-facing integration architecture and risk mitigation.'
      },
      Negotiation: {
        allowed: 'Base/Variable split (75/25), pooled vs quota commission, scope, and start date',
        forbidden: 'NEVER run PoC drills during compensation negotiation',
        deflect: 'Steer back to SA/SE compensation structure and role scope.'
      }
    };
    return solContracts[key] || solContracts.Technical;
  }

  if (archKey === 'em') {
    const emContracts = {
      HR: {
        allowed: 'engineering management trajectory, team size managed, people vs technical leadership balance, and comp expectations',
        forbidden: 'NEVER run IC algorithm/coding quizzes or syntax trivia',
        deflect: 'Keep the screen focused on management scope, org stage, and leadership fit.'
      },
      Behavioral: {
        allowed: 'coaching underperformers, PIPs, hiring rubrics, mediating Staff/PM conflict, burnout prevention, and retention',
        forbidden: 'NEVER turn this into live coding trivia or salary negotiation',
        deflect: 'Steer back to concrete people leadership and delivery outcomes.'
      },
      Technical: {
        allowed: 'delivery predictability (DORA/WIP), architectural risk oversight, incident culture, reliability budgets, and technical coaching',
        forbidden: 'NEVER quiz LeetCode algorithms or low-level language syntax',
        deflect: 'Redirect low-level syntax tangents back to engineering execution, risk management, and team leverage.'
      },
      'Live Coding': {
        allowed: 'live Engineering Management People & Delivery Scenario (resignation threat, mid-sprint scope clash, burnout recovery)',
        forbidden: 'NEVER ask the candidate to write programming code or LeetCode algorithms',
        deflect: 'Keep the scenario anchored on people judgment, explicit PM trade-offs, and sustainable team execution.'
      },
      'System Design': {
        allowed: 'multi-squad team topology, on-call health, hiring/career ladders, and scaling engineering rituals from 10 to 40 devs',
        forbidden: 'NEVER drift into compensation negotiation or coding trivia',
        deflect: 'Bring discussion back to org topology and engineering operating model.'
      },
      Negotiation: {
        allowed: 'M3/M4 level scope, headcount budget, equity, compensation, and reporting line',
        forbidden: 'NEVER run people crisis simulations during offer negotiation',
        deflect: 'Keep focus on EM scope and compensation alignment.'
      }
    };
    return emContracts[key] || emContracts.Technical;
  }

  if (cat === 'tpm' || cat === 'csm' || cat === 'people') {
    const nonCodeMeta = {
      tpm: { craft: 'critical path, RAID governance, cross-org dependencies, Go/No-Go launch readiness, and BLUF executive updates', live: 'live program rescue scenario (3-week API/InfoSec slip, scope cut & VP escalation)', design: '120-engineer cross-org planning, dependency intake, and release cadence' },
      csm: { craft: 'NRR/GRR health scoring, TTFV onboarding, ROI-anchored QBRs, and Tier-3 technical escalation triage', live: 'live enterprise churn rescue & QBR scenario (departed champion, adoption drop)', design: 'segmented CS & TAM operating model (tech-touch SMB to high-touch Enterprise)' },
      people: { craft: 'recruiting funnel pass-through math, structured rubrics, leveling/comp bands, attrition diagnostics, and EU HRBP compliance', live: 'live hiring bottleneck or high-attrition manager coaching case', design: 'end-to-end talent, leveling, onboarding, and performance calibration OS' }
    }[cat];
    const opsContracts = {
      HR: { allowed: `${archLabel} career mandate, org scale, stakeholder impact, and target compensation`, forbidden: 'NEVER ask programming or algorithm coding questions', deflect: 'Keep focus on role trajectory and alignment.' },
      Behavioral: { allowed: 'hard cross-functional pushes, stakeholder escalations, ethical boundaries, and measurable org/retention impact', forbidden: 'NEVER turn this into coding quizzes or comp talk', deflect: 'Steer back to concrete STAR leadership stories.' },
      Technical: { allowed: `${archLabel} mastery: ${nonCodeMeta.craft}`, forbidden: 'NEVER ask programming code or syntax trivia', deflect: `Redirect coding tangents back to ${archLabel} craft and metrics.` },
      'Live Coding': { allowed: `${nonCodeMeta.live} (NO coding)`, forbidden: 'NEVER ask the candidate to write programming code', deflect: 'Keep the focus strictly on structured operational/people diagnosis and clear action options.' },
      'System Design': { allowed: `${nonCodeMeta.design}`, forbidden: 'NEVER drift into salary negotiation or coding quizzes', deflect: 'Keep discussion anchored on scalable operating system design.' },
      Negotiation: { allowed: 'seniority band, OTE/bonus structure, scope/budget authority, and start date', forbidden: 'NEVER run operational case drills during negotiation', deflect: 'Steer back to compensation and mandate alignment.' }
    };
    return opsContracts[key] || opsContracts.Technical;
  }

  const contracts = {
    HR: {
      allowed: 'career summary, motivation for changing roles, team & communication fit, remote setup, availability/notice period, and high-level compensation alignment',
      forbidden: 'NEVER run technical deep-dives, coding/debugging quizzes, architecture design tests, or framework internals (leave those strictly to the Engineering panel in the next round)',
      deflect: 'If the candidate tries to drag you into deep technical Q&A or unrelated off-topic/non-interview requests, politely deflect in character (e.g., "I will leave the deep engineering questions to our Lead Engineers in the next round—let us stay focused on role fit and logistics") and steer back to HR screening.'
    },
    Behavioral: {
      allowed: 'past collaboration, stakeholder conflict, ownership, prioritization, mentoring, and measurable impact using STAR stories',
      forbidden: 'NEVER turn this into coding trivia, live debugging, or compensation negotiation',
      deflect: 'If the candidate goes off-topic or asks unrelated technical/non-interview questions, politely push back in character and steer back to concrete behavioral experiences.'
    },
    Technical: {
      allowed: `production ${archLabel} decisions, trade-offs, performance, debugging/triage, testing/security, and reliability`,
      forbidden: 'NEVER conduct HR salary/notice negotiation or unrelated non-interview tasks',
      deflect: 'If the candidate steers into HR compensation details or off-topic/non-interview requests, politely redirect (e.g., "Our recruiter handles compensation separately—let us keep focusing on the technical work") back to engineering depth.'
    },
    'Live Coding': {
      allowed: 'clarifying requirements, structured problem solving, data flow/state edge cases, complexity, and testing',
      forbidden: 'NEVER drift into HR logistics, salary talk, or unrelated non-interview assistance',
      deflect: 'If the candidate steers off-topic or outside the coding problem scope, deflect politely in character and guide them back to solving the problem step by step.'
    },
    'System Design': {
      allowed: 'architecture boundaries, API/data flow, scaling bottlenecks, caching, failure recovery, and observability',
      forbidden: 'NEVER drift into HR salary/notice screening, syntax trivia, or unrelated non-interview tasks',
      deflect: 'If the candidate tries to go off-topic or outside system architecture, deflect politely in character and bring the discussion back to architecture trade-offs.'
    },
    Negotiation: {
      allowed: 'role scope, seniority leveling, total compensation, contract terms, notice period, and start timeline',
      forbidden: 'NEVER run technical architecture interviews or coding quizzes',
      deflect: 'If the candidate tries to drag you into coding trivia or unrelated off-topic tangents, deflect politely in character and keep the focus on scope and compensation alignment.'
    }
  };
  return contracts[key] || contracts.Technical;
}

export function buildInterviewPacingDirectives({
  action = 'turn',
  topic = 'HR',
  userTurns = 0,
  elapsedSeconds = null,
  targetDurationSeconds = null,
  firstName = 'there',
  avatarName = 'the interviewer',
  companyName = '',
  personality = null,
  openerHint = null,
  compactMode = false
}) {
  const isStart = action === 'start' || userTurns === 0;
  const hasClock = Number.isFinite(Number(targetDurationSeconds)) && Number(targetDurationSeconds) > 0 && Number.isFinite(Number(elapsedSeconds));
  const remainingSec = hasClock ? Math.max(0, Number(targetDurationSeconds) - Number(elapsedSeconds)) : null;

  let phase = 'explore';
  if (isStart) phase = 'warmup';
  else if (userTurns === 1) phase = 'intro';
  else if ((remainingSec !== null && remainingSec <= 45) || userTurns >= 8) phase = 'closing';
  else if ((remainingSec !== null && remainingSec <= 150) || userTurns === 7) phase = 'reverse_qa';
  else if (userTurns <= 6) phase = 'explore';

  const moodDesc = personality?.mood ? ` (${personality.mood})` : '';
  const hintClean = String(openerHint || '').trim();
  const speakerIdentity = companyName ? `${avatarName} from ${companyName}` : avatarName;

  if (phase === 'warmup') {
    const startPrompt = compactMode
      ? `Greet ${firstName} warmly as ${speakerIdentity}${moodDesc}, welcome them briefly to this ${topic} chat, and ask ONLY a friendly check-in question (how their day/week is going). Save CV and role questions for the next turn.`
      : `Open the call naturally as ${speakerIdentity}${moodDesc}. Greet ${firstName} like a real human interviewer, set a brief relaxed welcome for this ${topic} chat (1 short sentence), and ask ONLY a light, friendly check-in question (e.g. how their day or week is going so far, or if they have a comfortable 10 minutes right now).
CRITICAL: Do NOT ask a CV-specific, technical, overlapping-dates, or compensation question yet—let ${firstName} respond to your greeting first before easing into the interview!`;

    const pacingBlock = compactMode
      ? `STAGE 0 (Warm Check-In): Give a natural 2-sentence greeting as ${speakerIdentity} and ask how ${firstName}'s day is going. Example tone: "Hi ${firstName}, I'm ${speakerIdentity}—thanks for joining today! How has your week been going so far?"`
      : `CONVERSATION PHASE 0 — WARM GREETING & CHECK-IN:
- Keep this opening natural, human, and unhurried (2-3 short spoken sentences total).
- Greet warmly as ${speakerIdentity} according to your personality, ask how ${firstName} is doing today, and hold ALL specific CV/technical/rate questions until the next turn.`;

    return { phase, pacingBlock, startPrompt };
  }

  if (phase === 'intro') {
    const scopeHint = topic === 'HR'
      ? 'Keep questions strictly within HR recruiter scope (career motivation, recent work overview, or what they look for in their next team — NO technical/architecture quizzing).'
      : topic === 'Negotiation'
        ? 'Open broadly around their role scope and expectations before numbers.'
        : 'Ask ONE broad, approachable opening question aligned strictly with your role authority.';
    const gentleTargetNote = hintClean
      ? ` Keep this round focus gently in mind as your eventual destination (do NOT ambush them with specific CV details yet): "${hintClean}".`
      : '';
    const pacingBlock = compactMode
      ? `STAGE 1 (Smooth Intro — ${topic} Scope): 1. Acknowledge their greeting warmly. 2. Briefly set the ${topic} agenda in one sentence. 3. ${scopeHint} Example: "Glad to hear that! We have about ten minutes today to talk through your background and goals—to start broad, what are you hoping to focus on in your next role?"`
      : `CONVERSATION PHASE 1 — SMOOTH AGENDA BRIDGE & BROAD OPENING (CRITICAL):
- First, react naturally to ${firstName}'s greeting in 1 brief friendly sentence.
- Second, use 1 smooth transition sentence to introduce this ${topic} conversation ("To ease us into things comfortably...", "I'd love to start with the big picture before digging into specifics...").
- Third, ${scopeHint}
- STRICT RULE: Do NOT jump abruptly from "How are you?" into code snippets, deep architecture trivia (especially in HR/Behavioral/Negotiation), or specific date traps—always open broad inside your ${topic} authority!${gentleTargetNote}`;
    return { phase, pacingBlock, startPrompt: '' };
  }

  if (phase === 'explore') {
    const cvBridgeNote =
      userTurns === 2 && hintClean
        ? `\n- If you weave in the target round focus ("${hintClean}") within ${topic} bounds, connect it gently to what ${firstName} just said in Turn 1 rather than dropping it out of nowhere.`
        : '';
    const stage2Example = topic === 'HR'
      ? '"That sounds like a rewarding chapter. Looking ahead, what kind of team culture and remote setup suits you best right now?"'
      : topic === 'Behavioral'
        ? '"Thanks for sharing that context. Could you walk me through a tough stakeholder disagreement you handled there?"'
        : topic === 'Negotiation'
          ? '"Got it, that scope sounds clear. Given that level of ownership, what target compensation band are you aiming for?"'
          : '"That makes sense. Speaking of that architecture, what was the hardest technical trade-off you had to make?"';
    const pacingBlock = compactMode
      ? `STAGE 2 (Bridged Follow-Up — STAY STRICTLY IN ${topic} SCOPE): React to one point ${firstName} shared, add a 1-sentence bridge${hintClean ? ` (aligned cleanly with ${topic} scope)` : ''}, and ask ONE ${topic}-appropriate question. Example: ${stage2Example}`
      : `CONVERSATION PHASE 2 — ANCHOR-FIRST EXPLORATION & SMOOTH TOPIC BRIDGES:
- Use a natural 3-beat spoken rhythm (2-4 concise sentences total):
  1. REACT briefly and authentically to a concrete point ${firstName} just made.
  2. BRIDGE smoothly in 1 sentence whenever shifting toward a new angle inside your ${topic} authority (if the candidate drifted out of scope or off-topic, deflect politely and steer back here).
  3. ASK ONE clear, focused ${topic}-scoped follow-up question.
- Keep transitions gradual and never step outside your ${topic} authority.${cvBridgeNote}`;
    return { phase, pacingBlock, startPrompt: '' };
  }

  if (phase === 'reverse_qa') {
    const scopeReminder =
      topic === 'HR'
        ? 'Answer ONLY HR/culture/team-process questions (if they ask deep technical trivia, note an engineer can cover it in the next round).'
        : `Keep your answers strictly within your ${topic} authority.`;
    const pacingBlock = compactMode
      ? `STAGE 3A (Reverse Q&A — ~2 min left): React briefly to their answer, mention we have ~2 minutes left, and invite ${firstName} to ask YOU questions about the role/team (or answer their question cleanly within ${topic} scope).`
      : `CONVERSATION PHASE 3A — REVERSE Q&A ("WHAT QUESTIONS DO YOU HAVE FOR ME?"):
- React naturally and concisely to ${firstName}'s previous answer.
- If you haven't invited their questions yet, notice the time naturally ("We have about two minutes left before we wrap up—what questions do you have for me about the team or role?").
- If ${firstName} just asked YOU a question, give a grounded, candid, realistic answer inside your role (${scopeReminder}) and check if they have one final quick question.`;
    return { phase, pacingBlock, startPrompt: '' };
  }

  const logisticsNote =
    topic === 'HR' || topic === 'Negotiation'
      ? 'If practical details (remote logistics, notice period, availability, or target compensation range) have not been covered yet, confirm them smoothly and thank them for their time.'
      : 'Briefly tie together one key takeaway from what they shared, thank them warmly for their questions and perspective, and explain next steps.';

  const pacingBlock = compactMode
    ? `STAGE 4 (Wrap-Up): React briefly to ${firstName}'s last question/point, thank them warmly, and state realistic next steps.`
    : `CONVERSATION PHASE 4 — SMOOTH FINAL WRAP-UP:
- Respond concisely to ${firstName}'s last point/question, then transition cleanly into closing ("That wraps up everything on my side today—thank you so much for your time...").
- ${logisticsNote}`;
  return { phase, pacingBlock, startPrompt: '' };
}

export function buildTurnContextAddendum({ interrupted = false, screenShareArtifact = null, highlightedLines = [], artifactNotes = '' } = {}) {
  const parts = [];
  if (interrupted) {
    parts.push('CALL EVENT (CANDIDATE BARGE-IN): The candidate jumped in while you were speaking. Acknowledge their point smoothly in 2-5 words without repeating your cut-off sentence verbatim.');
  }
  if (screenShareArtifact) {
    const numbered = screenShareArtifact.lines.map((l, idx) => `${idx + 1}: ${l}`).join('\n');
    const hi = Array.isArray(highlightedLines) && highlightedLines.length
      ? `\nCandidate highlighted line(s): ${highlightedLines.join(', ')}`
      : '';
    const notes = String(artifactNotes || '').trim()
      ? `\nCandidate scratch notes on screen share: "${String(artifactNotes).trim().slice(0, 400)}"`
      : '';
    parts.push(`=== SHARED SCREEN ARTIFACT (${screenShareArtifact.kind}: ${screenShareArtifact.title}) ===\n${numbered}${hi}${notes}\nUse this shared screen naturally when discussing code, bottlenecks, or trade-offs.`);
  }
  return parts.length ? `\n\n${parts.join('\n\n')}` : '';
}

/**
 * Keep only the most recent `maxMessages` turns verbatim and fold older turns into a brief summary line
 * so Small/Medium LLMs preserve memory without blowing their prompt budget.
 */
export function trimConversationForTier(messages = [], maxMessages = 12) {
  const list = Array.isArray(messages) ? messages : [];
  if (list.length <= maxMessages) return { recentMessages: list, earlierSummary: '' };
  const older = list.slice(0, list.length - maxMessages);
  const recentMessages = list.slice(list.length - maxMessages);
  const snippets = older
    .filter((m) => m?.content)
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: "${String(m.content).replace(/\s+/g, ' ').trim().slice(0, 75)}"`);
  const earlierSummary = snippets.length
    ? `EARLIER IN THIS CALL (summarized for focus): ${snippets.join(' | ')}`
    : '';
  return { recentMessages, earlierSummary };
}

/**
 * Assemble the final interview system & start prompts adapted to the active LLM context tier.
 */
export function buildInterviewPrompt({
  compactPrompt = false,
  activeProfilePrompt = '',
  meta = null,
  companyName = '',
  topic = 'HR',
  archKey = 'general',
  firstName = 'there',
  personalityBlock = '',
  pacing,
  earlierSummary = '',
  addendum = '',
  agentPrompt = '',
  jdPrompt = '',
  delimiter = '---COACH_JSON---',
  isContinuous = true,
  action = 'turn',
  retryOf = null
}) {
  const ndaClause = 'unless the candidate makes a major interview red flag (badmouthing past teams or sharing confidential internal data)';
  const flowRule = isContinuous
    ? `CONTINUOUS DIALOGUE MODE: React authentically in your assigned personality to a detail ${firstName} said, bridge smoothly if changing topic, and ask ONE follow-up or next question in 2-4 crisp spoken English sentences. NEVER interrupt with coachPause ${ndaClause}. INSTEAD, whenever ${firstName} says ANY grammar error, non-native phrasing, or awkward B2 wording, put 1-2 immediate fixes in "grammarFixes"!`
    : `STRICT COACH MODE: If ${firstName} uses plain B2 phrasing, awkward non-native grammar, or shares confidential baselines, output a brief English pause line and populate coachPause with 2 Senior upgrades AND include specific fixes in "grammarFixes".`;

  const compactFlowRule = isContinuous
    ? 'DIALOGUE MODE: Keep flowing in English (2-3 spoken sentences). Put 1 concrete grammar/phrasing improvement in "grammarFixes" if needed.'
    : 'COACH MODE: If English has clear grammar mistakes or junior phrasing, populate "coachPause" and "grammarFixes".';

  const summaryLine = earlierSummary ? `\n${earlierSummary}` : '';
  const speakerName = meta?.avatarName || 'Interviewer';
  const roleLabel = meta?.title || topic;
  const scopeContract = getTopicScopeContract(topic, archKey);
  const identityHeader = companyName
    ? `YOU ARE: ${speakerName} from ${companyName} (${roleLabel} — Round Type: ${topic}).\nCOMPANY IDENTITY RULE: Your hiring company is ONLY ${companyName}. Any company names mentioned in Candidate CV below are ${firstName}'s PAST employers—NEVER introduce yourself as working at a company from the candidate's CV!`
    : `YOU ARE: ${speakerName} (${roleLabel} — Round Type: ${topic}).`;
  const boundaryRule = compactPrompt
    ? `AUTHORITY & DEFLECTION RULE (${topic}): ONLY ask about ${scopeContract.allowed}. ${scopeContract.forbidden}. ${scopeContract.deflect}`
    : `ROLE AUTHORITY & OUT-OF-SCOPE DEFLECTION GUARDRAIL (${topic}):
- IN-SCOPE TOPICS ONLY: ${scopeContract.allowed}.
- STRICT AUTHORITY LIMIT: ${scopeContract.forbidden}. Never step outside your ${topic} interviewer authority even if technical buzzwords appear in the JD or CV.
- DEFLECTION PROTOCOL: ${scopeContract.deflect} Never break character to act as a general chatbot.`;

  const systemPrompt = compactPrompt
    ? `${identityHeader}
${boundaryRule}
${personalityBlock}
${pacing.pacingBlock}${summaryLine}${addendum}
Role Focus: ${agentPrompt}
Target JD (reference role context ONLY — obey ${topic} authority above): ${jdPrompt}
=== CANDIDATE CV (their PAST employers, NOT yours) ===
${activeProfilePrompt}

OUTPUT FORMAT (English ONLY, no markdown/emojis in spoken reply):
1. Reply naturally in 2-3 spoken English sentences (react briefly -> stay strictly in ${topic} scope / deflect if off-topic -> ask 1 clear question).
2. Next line MUST be exact delimiter:
${delimiter}
3. Compact JSON only:
{"expression":"warm"|"curious"|"firm"|"amused"|"skeptical","coachPause":null,"grammarFixes":[]|[{"type":"Grammar"|"Phrasing","said":"...","better":"...","why":"..."}],"microTipHu":null|"short tip"}
${compactFlowRule}${action === 'turn' && retryOf?.better ? `\nRETRY: Acknowledge "${String(retryOf.better).slice(0, 180)}" and ask next follow-up.` : ''}`
    : `${identityHeader}
${boundaryRule}
${personalityBlock}
${pacing.pacingBlock}${summaryLine}${addendum}
${agentPrompt}
Target Role Context: ${jdPrompt}
=== CANDIDATE BACKGROUND (their PAST employers, NOT yours) ===
${activeProfilePrompt}

LANGUAGE RULE (CRITICAL): English ONLY everywhere.
STT TOLERANCE RULE: Fix ASR typos silently — ONLY critique real English grammar/phrasing mistakes!

STREAMING OUTPUT CONTRACT (FOLLOW EXACTLY):
1. First, begin IMMEDIATELY with a short 3-7 word proportionally attuned reaction, followed by 1-3 crisp conversational sentences (include a gentle 1-sentence transition bridge whenever introducing a new angle or CV detail; NO markdown, NO emojis, NO bullet points, NO JSON yet).
2. After the spoken English reply, put exact delimiter on its own line:
${delimiter}
3. Immediately after the delimiter, write ONE compact JSON object in English ONLY:
{
  "expression": "warm" | "curious" | "firm" | "amused" | "skeptical",
  "coachPause": null | {"category":"B2-to-Senior"|"Grammar"|"Non-Native"|"Anti-Freeze"|"NDA-Safety","original":"phrase","reasonHu":"short English explanation","seniorUpgrades":["upgrade 1","upgrade 2"]},
  "grammarFixes": [] | [{"type":"Grammar"|"Phrasing"|"Non-Native"|"Senior-Tone","said":"exact weak or ungrammatical phrase candidate said","better":"natural C1 Senior phrasing fix","why":"1 concise sentence explaining the fix"}],
  "microTipHu": null | "1 short vocabulary/delivery tip"
}
On EVERY "turn" (not "start"): include 1-2 "grammarFixes" whenever anything grammatical or phrasing-wise can be improved! On "start", set "grammarFixes": [].
${flowRule}${action === 'turn' && retryOf?.better ? `\n\nRETRY PRACTICE NOTE: ${firstName} clicked "Say It Again" to practice improving "${String(retryOf.said || '').slice(0, 180)}" -> "${String(retryOf.better).slice(0, 240)}". Briefly acknowledge cleanly, then ask your next follow-up.` : ''}`;

  const startPrompt = `${pacing.startPrompt}\nThen output ${delimiter} with empty grammarFixes and null coachPause.`;
  return { systemPrompt, startPrompt };
}

export const TUTOR_PACING_RULE =
  'SMOOTH CONVERSATIONAL BRIDGING: Follow the learner’s thread naturally. When gently introducing a new subtopic or English nuance, use a soft conversational bridge ("Speaking of that...", "By the way, that reminds me...") instead of abrupt subject switches.';

export const LOGIC_PACING_RULE =
  'STEADY COLLABORATIVE CADENCE: Transition calmly between steps on the Scratchpad—acknowledge their current reasoning cleanly before nudging toward the next constraint or edge case.';
