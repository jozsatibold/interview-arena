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
export function buildInterviewPacingDirectives({
  action = 'turn',
  topic = 'HR',
  userTurns = 0,
  firstName = 'there',
  avatarName = 'the interviewer',
  personality = null,
  openerHint = null,
  compactMode = false
}) {
  const isStart = action === 'start' || userTurns === 0;
  const phase = isStart ? 'warmup' : userTurns === 1 ? 'intro' : userTurns <= 3 ? 'explore' : 'closing';
  const moodDesc = personality?.mood ? ` (${personality.mood})` : '';
  const hintClean = String(openerHint || '').trim();

  if (phase === 'warmup') {
    const startPrompt = compactMode
      ? `Greet ${firstName} warmly as ${avatarName}${moodDesc}, welcome them briefly to this ${topic} chat, and ask ONLY a friendly check-in question (how their day/week is going). Save CV and role questions for the next turn.`
      : `Open the call naturally as ${avatarName}${moodDesc}. Greet ${firstName} like a real human interviewer, set a brief relaxed welcome for this ${topic} chat (1 short sentence), and ask ONLY a light, friendly check-in question (e.g. how their day or week is going so far, or if they have a comfortable 10 minutes right now).
CRITICAL: Do NOT ask a CV-specific, technical, overlapping-dates, or compensation question yet—let ${firstName} respond to your greeting first before easing into the interview!`;

    const pacingBlock = compactMode
      ? `STAGE 0 (Warm Check-In): Give a natural 2-sentence greeting and ask how ${firstName}'s day is going. Example tone: "Hi ${firstName}, thanks for joining today! How has your week been going so far?"`
      : `CONVERSATION PHASE 0 — WARM GREETING & CHECK-IN:
- Keep this opening natural, human, and unhurried (2-3 short spoken sentences total).
- Greet warmly according to your personality, ask how ${firstName} is doing today, and hold ALL specific CV/technical/rate questions until the next turn.`;

    return { phase, pacingBlock, startPrompt };
  }

  if (phase === 'intro') {
    const gentleTargetNote = hintClean
      ? ` Keep this round focus gently in mind as your eventual destination (do NOT ambush them with specific CV details yet): "${hintClean}".`
      : '';
    const pacingBlock = compactMode
      ? `STAGE 1 (Smooth Intro): 1. Acknowledge their greeting warmly. 2. Introduce the 10-minute agenda in one sentence. 3. Ask ONE broad, easy opening question about their current work. Example: "Glad to hear that! We have about ten minutes today to get to know your background—to start broad, what have you been focusing on most recently?"`
      : `CONVERSATION PHASE 1 — SMOOTH AGENDA BRIDGE & BROAD OPENING (CRITICAL):
- First, react naturally to ${firstName}'s greeting in 1 brief friendly sentence.
- Second, use 1 smooth transition sentence to introduce what you'd like to explore together today ("To ease us into things comfortably...", "I'd love to start with the big picture before digging into specifics...").
- Third, ask ONE broad, approachable opening question (e.g., an overview of what they have been working on recently or what drew them to this kind of role).
- STRICT RULE: Do NOT jump abruptly from "How are you?" straight into a specific CV bullet, date discrepancy, code snippet, or rate question—always open broad first!${gentleTargetNote}`;
    return { phase, pacingBlock, startPrompt: '' };
  }

  if (phase === 'explore') {
    const cvBridgeNote =
      userTurns === 2 && hintClean
        ? `\n- If you now weave in the target round focus ("${hintClean}") or a specific CV detail, connect it gently to what ${firstName} just said in Turn 1 (e.g., "That lines up nicely with something I saw on your CV regarding...") rather than dropping it out of nowhere.`
        : '';
    const pacingBlock = compactMode
      ? `STAGE 2 (Bridged Follow-Up): React to one point ${firstName} just shared, add a 1-sentence bridge if introducing a CV detail${hintClean ? ` (focus: "${hintClean.slice(0, 140)}")` : ''}, and ask ONE clear question. Example: "That makes sense. Speaking of that project, what was the trickiest constraint you had to solve?"`
      : `CONVERSATION PHASE 2 — ANCHOR-FIRST EXPLORATION & SMOOTH TOPIC BRIDGES:
- Use a natural 3-beat spoken rhythm (2-4 concise sentences total):
  1. REACT briefly and authentically to a concrete point ${firstName} just made.
  2. BRIDGE smoothly in 1 sentence whenever shifting toward a new angle or CV detail (explain *why* you're moving there, e.g., "Speaking of team collaboration, I'd love to touch on..." or "Building on what you just described, I noticed in your background...").
  3. ASK ONE clear, focused follow-up question.
- Keep topic transitions gradual—avoid jumping sharply between unrelated subjects without a bridge sentence.${cvBridgeNote}`;
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
  const systemPrompt = compactPrompt
    ? `${activeProfilePrompt}
Interviewer: ${meta?.avatarName || 'Interviewer'} (${meta?.title || topic}).
${personalityBlock}
${pacing.pacingBlock}${summaryLine}
Role Focus: ${agentPrompt}
Target JD: ${jdPrompt}

OUTPUT FORMAT (English ONLY, no markdown/emojis in spoken reply):
1. Reply naturally in 2-3 spoken English sentences (react briefly -> bridge if switching topic -> ask 1 clear question).
2. Next line MUST be exact delimiter:
${delimiter}
3. Compact JSON only:
{"coachPause":null,"grammarFixes":[]|[{"type":"Grammar"|"Phrasing","said":"...","better":"...","why":"..."}],"microTipHu":null|"short tip"}
${compactFlowRule}${action === 'turn' && retryOf?.better ? `\nRETRY: Acknowledge "${String(retryOf.better).slice(0, 180)}" and ask next follow-up.` : ''}`
    : `${activeProfilePrompt}
Interviewer Persona: ${meta?.avatarName || 'Interviewer'} (${meta?.title || topic}).
${personalityBlock}
${pacing.pacingBlock}${summaryLine}
${agentPrompt}
Target Role: ${jdPrompt}

LANGUAGE RULE (CRITICAL): English ONLY everywhere.
STT TOLERANCE RULE: Fix ASR typos silently — ONLY critique real English grammar/phrasing mistakes!

STREAMING OUTPUT CONTRACT (FOLLOW EXACTLY):
1. First, begin IMMEDIATELY with a short 3-7 word proportionally attuned reaction, followed by 1-3 crisp conversational sentences (include a gentle 1-sentence transition bridge whenever introducing a new angle or CV detail; NO markdown, NO emojis, NO bullet points, NO JSON yet).
2. After the spoken English reply, put exact delimiter on its own line:
${delimiter}
3. Immediately after the delimiter, write ONE compact JSON object in English ONLY:
{
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
