/**
 * Conversational Pacing & Smooth Topic Transition Helpers
 * Prevents abrupt whiplash (e.g. "How are you?" -> sudden hyper-specific CV ambush)
 * by structuring interviews into Warm-Up -> Broad Intro -> Bridged Exploration -> Smooth Wrap-Up.
 */

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
export function getTopicScopeContract(topic = 'HR') {
  const key = String(topic || 'HR').trim();
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
      allowed: 'production engineering decisions, stack trade-offs, performance, debugging, testing, and system reliability',
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
  firstName = 'there',
  avatarName = 'the interviewer',
  companyName = '',
  personality = null,
  openerHint = null,
  compactMode = false
}) {
  const isStart = action === 'start' || userTurns === 0;
  const phase = isStart ? 'warmup' : userTurns === 1 ? 'intro' : userTurns <= 3 ? 'explore' : 'closing';
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

  const logisticsNote =
    topic === 'HR' || topic === 'Negotiation'
      ? 'If practical details (remote logistics, notice period, availability, or target compensation range) have not been covered yet, introduce them smoothly now as practical alignment ("Since we are getting close to wrapping up, I would love to quickly align on practical logistics...").'
      : 'Briefly tie together one key takeaway from what they shared and smoothly ask one closing angle or invite one question from them before wrapping up.';

  const pacingBlock = compactMode
    ? `STAGE 3 (Wrap-Up): React briefly to their answer, smoothly signal closing ("Before we wrap up today..."), and cover final logistics or invite 1 question.`
    : `CONVERSATION PHASE 3 — SMOOTH LATE-STAGE TRANSITION & WRAP-UP:
- React concisely to ${firstName}'s previous answer, then signpost cleanly that you are moving toward final alignment ("Before we start wrapping up...", "On a slightly more practical note as we round out the call...").
- ${logisticsNote}`;
  return { phase, pacingBlock, startPrompt: '' };
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
  firstName = 'there',
  personalityBlock = '',
  pacing,
  earlierSummary = '',
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
  const scopeContract = getTopicScopeContract(topic);
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
${pacing.pacingBlock}${summaryLine}
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
${pacing.pacingBlock}${summaryLine}
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
