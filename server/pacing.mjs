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
  openerHint = null
}) {
  const isStart = action === 'start' || userTurns === 0;
  const phase = isStart ? 'warmup' : userTurns === 1 ? 'intro' : userTurns <= 3 ? 'explore' : 'closing';
  const moodDesc = personality?.mood ? ` (${personality.mood})` : '';
  const hintClean = String(openerHint || '').trim();

  if (phase === 'warmup') {
    const startPrompt = `Open the call naturally as ${avatarName}${moodDesc}. Greet ${firstName} like a real human interviewer, set a brief relaxed welcome for this ${topic} chat (1 short sentence), and ask ONLY a light, friendly check-in question (e.g. how their day or week is going so far, or if they have a comfortable 10 minutes right now).
CRITICAL: Do NOT ask a CV-specific, technical, overlapping-dates, or compensation question yet—let ${firstName} respond to your greeting first before easing into the interview!`;

    const pacingBlock = `CONVERSATION PHASE 0 — WARM GREETING & CHECK-IN:
- Keep this opening natural, human, and unhurried (2-3 short spoken sentences total).
- Greet warmly according to your personality, ask how ${firstName} is doing today, and hold ALL specific CV/technical/rate questions until the next turn.`;

    return { phase, pacingBlock, startPrompt };
  }

  if (phase === 'intro') {
    const gentleTargetNote = hintClean
      ? ` Keep this round focus gently in mind as your eventual destination (do NOT ambush them with specific CV details yet): "${hintClean}".`
      : '';
    const pacingBlock = `CONVERSATION PHASE 1 — SMOOTH AGENDA BRIDGE & BROAD OPENING (CRITICAL):
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
    const pacingBlock = `CONVERSATION PHASE 2 — ANCHOR-FIRST EXPLORATION & SMOOTH TOPIC BRIDGES:
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

  const pacingBlock = `CONVERSATION PHASE 3 — SMOOTH LATE-STAGE TRANSITION & WRAP-UP:
- React concisely to ${firstName}'s previous answer, then signpost cleanly that you are moving toward final alignment ("Before we start wrapping up...", "On a slightly more practical note as we round out the call...").
- ${logisticsNote}`;
  return { phase, pacingBlock, startPrompt: '' };
}

export const TUTOR_PACING_RULE =
  'SMOOTH CONVERSATIONAL BRIDGING: Follow the learner’s thread naturally. When gently introducing a new subtopic or English nuance, use a soft conversational bridge ("Speaking of that...", "By the way, that reminds me...") instead of abrupt subject switches.';

export const LOGIC_PACING_RULE =
  'STEADY COLLABORATIVE CADENCE: Transition calmly between steps on the Scratchpad—acknowledge their current reasoning cleanly before nudging toward the next constraint or edge case.';
