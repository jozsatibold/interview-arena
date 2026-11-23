/**
 * Interview Script Engine — Cohesive Beat & Variant Catalog (SCRIPT-01)
 * Defines 8 sequential interview stages with 3-4 realistic, compatible variations each,
 * plus graph edges (`provides`, `excludes`, `requiresAny`, `preferredNext`, `forbiddenNext`)
 * so every rolled interview flows naturally without abrupt topic jumps or repetition.
 */

export const SCRIPT_STAGES = [
  'arrival',
  'framing',
  'candidate_arc',
  'core_anchor',
  'probe_challenge',
  'applied_case',
  'reverse_qa',
  'closing'
];

const ALL_TIERS = ['ic', 'manager', 'executive'];
const LEADER_TIERS = ['manager', 'executive'];
const ALL_TOPICS = ['HR', 'Behavioral', 'Technical', 'Live Coding', 'System Design', 'Negotiation'];
const NON_NEGOTIATION_TOPICS = ['HR', 'Behavioral', 'Technical', 'Live Coding', 'System Design'];
const CASE_TOPICS = ['Behavioral', 'Technical', 'Live Coding', 'System Design'];

export const SCRIPT_BEATS = [
  // =========================================================================
  // STAGE 1: ARRIVAL & ICEBREAKER (4 variations)
  // =========================================================================
  {
    id: 'arrival_warm_smalltalk',
    stage: 'arrival',
    label: 'Warm Human Small Talk',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['warm_greeting'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['framing_company_story', 'framing_interviewer_path'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'React warmly to how their week is going and ease straight into context before asking any heavy question.',
    promptLean:
      'Greet {{firstName}} warmly as {{speaker}}, welcome them briefly to this {{topic}} chat, and ask ONLY a friendly check-in question (how their day or week is going). Save role and CV questions for the next turn.',
    promptRich:
      'Open naturally like a real human interviewer as {{speaker}}. Greet {{firstName}} warmly, share a relaxed 1-sentence welcome for this {{topic}} conversation, and ask ONLY a light check-in question about how their day or week has been going. Do NOT ask any CV, technical, or compensation questions yet.'
  },
  {
    id: 'arrival_calm_logistics',
    stage: 'arrival',
    label: 'Calm Audio & Time Check-In',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['warm_greeting', 'time_checked'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['framing_role_problem', 'framing_interviewer_path'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Thank them for confirming the setup and transition into framing the role problem or today’s flow.',
    promptLean:
      'Greet {{firstName}} calmly as {{speaker}}, thank them for making time for this {{topic}} chat, and ask ONLY if audio feels clear and they are comfortable getting started.',
    promptRich:
      'Greet {{firstName}} calmly and thoughtfully as {{speaker}}. Welcome them to the call, check briefly that everything sounds clear on their end and that the {{durationLabel}} window works comfortably for them right now, and hold all interview questions for the next turn.'
  },
  {
    id: 'arrival_remote_rhythm',
    stage: 'arrival',
    label: 'Workday Rhythm & Energy Check',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['warm_greeting'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['framing_company_story', 'framing_role_problem'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Pick up on their energy or schedule cue and pivot smoothly into setting context for the team and company.',
    promptLean:
      'Greet {{firstName}} as {{speaker}}, welcome them to this {{topic}} session, and ask lightly whether they are having a busy day or a calm start so far.',
    promptRich:
      'Open with easy conversational warmth as {{speaker}}. Greet {{firstName}}, mention you appreciate them carving out time from their day for this {{topic}} conversation, and ask a relaxed icebreaker about how busy their day or timezone morning has been so far. Hold all evaluation questions until Turn 2.'
  },
  {
    id: 'arrival_peer_exec',
    stage: 'arrival',
    label: 'Peer Executive Welcome',
    tiers: LEADER_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['warm_greeting', 'peer_tone'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['framing_mutual_calibration', 'framing_role_problem', 'framing_company_story'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Move directly from a grounded peer greeting into calibrating the mandate and agenda together.',
    promptLean:
      'Greet {{firstName}} as a senior peer ({{speaker}}), welcome them to this {{topic}} conversation, and ask briefly how their week is shaping up.',
    promptRich:
      'Open with composed, peer-level respect as {{speaker}}—no stiff recruiter clichés. Welcome {{firstName}} to this {{topic}} discussion, note you have been looking forward to comparing notes today, and ask one grounded check-in question about how their week is going before diving into the mandate.'
  },

  // =========================================================================
  // STAGE 2: CONTEXT & FRAMING (4 variations)
  // =========================================================================
  {
    id: 'framing_company_story',
    stage: 'framing',
    label: 'Company Mission & Stage Pitch',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['company_pitch', 'agenda_set'],
    excludes: ['company_pitch'],
    requiresAny: [],
    preferredNext: ['arc_next_chapter_motivation', 'arc_career_highlights', 'anchor_mandate_thesis'],
    forbiddenNext: ['arc_problem_resonance'],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Invite {{firstName}} to share what caught their interest or what they want in their next chapter—do NOT pitch the company again.',
    promptLean:
      'React warmly to {{firstName}}’s greeting, share 1-2 short sentences about what {{companyLabel}} builds and its current growth stage, then ask a broad opening question on what excites them about their next {{topic}} chapter.',
    promptRich:
      '1. React naturally to {{firstName}}’s greeting in 1 sentence. 2. Share a crisp, authentic 2-sentence snapshot of {{companyLabel}}—where the product stands right now and what makes this stage exciting (without rushing). 3. Ease into the {{topic}} conversation with ONE broad opening question about what drew their attention or what kind of chapter they are optimizing for next.'
  },
  {
    id: 'framing_role_problem',
    stage: 'framing',
    label: 'Team & Real Problem Brief',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['role_context', 'team_painpoint', 'agenda_set'],
    excludes: ['role_context'],
    requiresAny: [],
    preferredNext: ['arc_problem_resonance', 'arc_current_scope', 'anchor_domain_tradeoff'],
    forbiddenNext: ['arc_career_highlights'],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Link the concrete team challenge you just outlined directly to {{firstName}}’s recent hands-on work.',
    promptLean:
      'Acknowledge {{firstName}}’s check-in briefly, outline the main problem this team at {{companyLabel}} is hiring to solve within {{topic}} scope, and ask how that compares to what they work on now.',
    promptRich:
      '1. Respond warmly to {{firstName}}’s greeting in 1 brief sentence. 2. Set human context by briefly describing the real team need behind this role at {{companyLabel}} within {{topic}} bounds (without turning it into a quiz). 3. Bridge smoothly by asking a broad question about how that challenge resonates with what they have been tackling recently.'
  },
  {
    id: 'framing_interviewer_path',
    stage: 'framing',
    label: 'Interviewer Intro & Flow Preview',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['interviewer_intro', 'agenda_set'],
    excludes: ['interviewer_intro'],
    requiresAny: [],
    preferredNext: ['arc_career_highlights', 'arc_current_scope', 'anchor_cv_deepdive'],
    forbiddenNext: ['arc_problem_resonance'],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Having introduced your own seat and the call outline, invite {{firstName}} to paint the big picture of their background.',
    promptLean:
      'React warmly to {{firstName}}, mention your own perspective as {{speaker}} plus a quick 1-sentence flow for today’s {{topic}} chat, and invite them to give a broad snapshot of their recent background.',
    promptRich:
      '1. Acknowledge {{firstName}}’s check-in warmly. 2. In 2 natural sentences, share briefly how you fit into {{companyLabel}} as {{speaker}} and outline a relaxed roadmap for this {{topic}} conversation (big picture first, deeper examples later, and time for their questions). 3. Invite {{firstName}} to kick off with a high-level overview of their recent arc.'
  },
  {
    id: 'framing_mutual_calibration',
    stage: 'framing',
    label: 'Mutual Mandate Calibration',
    tiers: LEADER_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['role_context', 'agenda_set', 'mutual_tone'],
    excludes: ['agenda_set'],
    requiresAny: [],
    preferredNext: ['arc_current_scope', 'arc_next_chapter_motivation', 'anchor_mandate_thesis'],
    forbiddenNext: ['arc_problem_resonance'],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Pick up the focus area {{firstName}} highlights and connect it cleanly to their current leadership scope.',
    promptLean:
      'Acknowledge {{firstName}} as a peer, frame the core mandate for this {{topic}} round in 1 sentence, and ask which facet of the role matters most for them to explore first.',
    promptRich:
      '1. React naturally to {{firstName}}’s check-in. 2. Frame today’s {{topic}} conversation as a two-way calibration at {{companyLabel}}: share 1-2 crisp sentences on the leadership mandate on the table. 3. Ask {{firstName}} broadly where their current focus sits and which aspect of this mandate they want to unpack together first.'
  },

  // =========================================================================
  // STAGE 3: CANDIDATE WARM-IN / BIG PICTURE (4 variations)
  // =========================================================================
  {
    id: 'arc_career_highlights',
    stage: 'candidate_arc',
    label: 'Career Arc & Proud Moments',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['candidate_overview'],
    excludes: ['candidate_overview'],
    requiresAny: [],
    preferredNext: ['anchor_cv_deepdive', 'anchor_collaboration_story'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Choose one concrete project or milestone {{firstName}} just mentioned as the anchor for deeper exploration.',
    promptLean:
      'React warmly to {{firstName}}’s point, bridge gently into their recent background within {{topic}} bounds, and ask which project from the past year or two they are proudest of.',
    promptRich:
      'Acknowledge what {{firstName}} shared with a grounded reaction, then zoom out smoothly into their recent trajectory inside {{topic}} bounds: invite them to highlight one chapter or initiative from the last couple of years where they felt their impact really clicked.'
  },
  {
    id: 'arc_problem_resonance',
    stage: 'candidate_arc',
    label: 'Problem Resonance Warm-In',
    tiers: ALL_TIERS,
    topics: NON_NEGOTIATION_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['candidate_overview', 'problem_link'],
    excludes: ['candidate_overview'],
    requiresAny: ['team_painpoint'],
    preferredNext: ['anchor_domain_tradeoff', 'anchor_cv_deepdive', 'anchor_mandate_thesis'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Zoom into the exact trade-off or messy decision inside the matching problem {{firstName}} just brought up.',
    promptLean:
      'React to what {{firstName}} noticed about the team problem, and ask them to walk through the closest past situation they have handled at a high level.',
    promptRich:
      'Build directly on {{firstName}}’s reaction to the team problem you framed earlier: affirm what clicked, and ask them to walk you through the closest parallel from their own work at a high level before digging into details.'
  },
  {
    id: 'arc_next_chapter_motivation',
    stage: 'candidate_arc',
    label: 'Next-Chapter Motivation & Fit',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['motivation_fit'],
    excludes: ['motivation_fit'],
    requiresAny: [],
    preferredNext: ['anchor_collaboration_story', 'anchor_mandate_thesis', 'anchor_cv_deepdive'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Connect what drives {{firstName}} next directly into a real story or trade-off demonstrating that strength.',
    promptLean:
      'React thoughtfully to {{firstName}}’s answer and ask what kind of environment, autonomy, or problem scope brings out their best work in {{topic}} terms.',
    promptRich:
      'Reflect briefly on what {{firstName}} shared, and use a warm 1-sentence bridge to explore their motivation: ask what kind of team setup, problem ambiguity, and ownership model brings out their strongest work—while keeping it grounded in {{topic}} reality.'
  },
  {
    id: 'arc_current_scope',
    stage: 'candidate_arc',
    label: 'Current Scope & Decision Snapshot',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['candidate_scope'],
    excludes: ['candidate_scope'],
    requiresAny: [],
    preferredNext: ['anchor_domain_tradeoff', 'anchor_mandate_thesis', 'anchor_cv_deepdive'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: 'Pick one high-stakes piece of {{firstName}}’s current scope and explore the toughest decision inside it.',
    promptLean:
      'Acknowledge {{firstName}}’s previous point cleanly and ask for a quick snapshot of their current day-to-day scope and key decisions inside {{topic}} bounds.',
    promptRich:
      'Respond concisely to {{firstName}}’s remark, then transition smoothly into calibrating their current altitude: ask what their day-to-day ownership, team interfaces, and hardest recurring decisions look like right now (strictly within {{topic}} scope).'
  },

  // =========================================================================
  // STAGE 4: CORE EXPLORATION / ANCHOR DEEP-DIVE (4 variations)
  // =========================================================================
  {
    id: 'anchor_cv_deepdive',
    stage: 'core_anchor',
    label: 'Concrete Project / CV Anchor',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['core_evidence'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['probe_postmortem_failure', 'probe_scale_constraint', 'qa_classic_team', 'qa_candid_insider'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Transition naturally from what worked in that project toward what broke, stretched, or required tough correction.',
    promptLean:
      'Pick up one concrete thread from {{firstName}}’s answer (aligned gently with {{topic}} focus), bridge in 1 sentence, and ask a focused follow-up on their specific ownership and measurable outcome.',
    promptRich:
      'Anchor firmly on one real project or responsibility {{firstName}} just raised (weaving in target round focus only if it fits naturally). Use a crisp 1-sentence bridge and dig into the concrete mechanics of their personal contribution, constraints, and measurable result—staying strictly inside {{topic}} authority.'
  },
  {
    id: 'anchor_domain_tradeoff',
    stage: 'core_anchor',
    label: 'Craft & Trade-Off Judgment',
    tiers: ALL_TIERS,
    topics: ['Behavioral', 'Technical', 'Live Coding', 'System Design', 'Negotiation'],
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['core_evidence', 'tradeoff_lens'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['probe_devils_advocate', 'probe_scale_constraint', 'probe_edge_risk_audit', 'case_screenshare_handoff'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Push gently on the losing side of that trade-off or test how it holds under tighter constraints.',
    promptLean:
      'React briefly to {{firstName}}’s point and ask ONE sharp {{topic}}-scoped question about the hardest trade-off they had to weigh and why they rejected the alternative.',
    promptRich:
      'React authentically to the angle {{firstName}} just shared, bridge in 1 smooth sentence, and explore a genuine {{topic}}-scoped trade-off: ask what competing option they intentionally walked away from, what signal drove the call, and what cost it carried.'
  },
  {
    id: 'anchor_collaboration_story',
    stage: 'core_anchor',
    label: 'Cross-Functional Alignment & Friction',
    tiers: ALL_TIERS,
    topics: ['HR', 'Behavioral', 'Technical', 'Negotiation'],
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['core_evidence', 'collab_lens'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['probe_postmortem_failure', 'probe_devils_advocate', 'qa_candid_insider', 'qa_classic_team'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Shift smoothly from stakeholder consensus toward a moment where alignment broke down or feedback stung.',
    promptLean:
      'Acknowledge {{firstName}}’s context and ask how they aligned skeptical partners or navigated a real disagreement within {{topic}} bounds.',
    promptRich:
      'Validate {{firstName}}’s context briefly, then bridge into human dynamics appropriate for {{topic}}: ask about a moment they had to earn alignment across conflicting incentives (peers, stakeholders, or leadership) without relying solely on formal authority.'
  },
  {
    id: 'anchor_mandate_thesis',
    stage: 'core_anchor',
    label: 'Leadership & Strategy Thesis',
    tiers: LEADER_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['core_evidence', 'strategy_lens'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['probe_scale_constraint', 'probe_devils_advocate', 'case_screenshare_handoff', 'qa_exec_mutual_diligence'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Stress-test where their strategic thesis collides with org friction, budget reality, or Board impatience.',
    promptLean:
      'React concisely as a peer and ask {{firstName}} what single highest-leverage move they would prioritize in the first 60-90 days within {{topic}} scope.',
    promptRich:
      'Engage at senior executive/management altitude: react concisely to {{firstName}}’s perspective, then ask for their candid thesis—what two diagnostic signals they would inspect first and what unpopular call they might need to make early within {{topic}} scope.'
  },

  // =========================================================================
  // STAGE 5: DEPTH PROBE / STRESS-TEST (4 variations — Standard & Rich)
  // =========================================================================
  {
    id: 'probe_postmortem_failure',
    stage: 'probe_challenge',
    label: 'Post-Mortem & Unfiltered Lesson',
    tiers: ALL_TIERS,
    topics: NON_NEGOTIATION_TOPICS,
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['reflection_probe'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['case_verbal_triage', 'qa_candid_insider', 'qa_classic_team'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Move constructively from lessons learned toward either a live scenario or candid questions about our reality.',
    promptLean:
      'React fairly to {{firstName}}’s answer and ask what still went wrong, surprised them, or what they would redesign with hindsight.',
    promptRich:
      'Acknowledge what worked in {{firstName}}’s story, then bridge naturally into an honest stress-test: ask where that approach cracked, what blind spot surfaced late, or what concrete mechanism they changed afterward so it would not repeat.'
  },
  {
    id: 'probe_devils_advocate',
    stage: 'probe_challenge',
    label: 'Polite Devil’s Advocate Pushback',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['conviction_probe'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['case_screenshare_handoff', 'case_give_get_negotiation', 'qa_exec_mutual_diligence', 'qa_candid_insider'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Carry that sharper calibration directly into a concrete live exercise or candid two-way Q&A.',
    promptLean:
      'Respond respectfully to {{firstName}}, offer one realistic counter-argument inside {{topic}} bounds, and ask how they would defend or adapt their stance.',
    promptRich:
      'Keep your tone respectful yet unvarnished: briefly affirm the core logic in {{firstName}}’s answer, then introduce ONE realistic counter-argument or skeptical stakeholder objection (strictly inside {{topic}} bounds) to see whether they adapt cleanly or hold firm with evidence.'
  },
  {
    id: 'probe_scale_constraint',
    stage: 'probe_challenge',
    label: 'Scale / Budget Constraint Twist',
    tiers: ALL_TIERS,
    topics: CASE_TOPICS,
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['scale_probe'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['case_screenshare_handoff', 'case_verbal_triage', 'qa_classic_team', 'qa_exec_mutual_diligence'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Shift from hypothetical scale pressure into inspecting a concrete artifact or triage decision together.',
    promptLean:
      'React to {{firstName}}’s design/approach and introduce ONE sharper constraint (3x volume, half the budget, or tighter SLA) inside {{topic}} bounds.',
    promptRich:
      'Build directly on {{firstName}}’s prior reasoning and introduce ONE crisp constraint twist tailored to {{topic}}—such as 5x load, 30% tighter budget, or a sudden deadline compression—and ask what breaks first and what they cut.'
  },
  {
    id: 'probe_edge_risk_audit',
    stage: 'probe_challenge',
    label: 'Hidden Risk & Metric Audit',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'rich',
    requiresScreenShare: false,
    provides: ['risk_probe'],
    excludes: [],
    requiresAny: [],
    preferredNext: ['case_screenshare_handoff', 'case_give_get_negotiation', 'qa_exec_mutual_diligence'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Pivot smoothly from hidden risks into practical execution or executive due diligence.',
    promptLean:
      'React briefly and probe ONE second-order risk, blind spot, or failure metric {{firstName}} has not mentioned yet inside {{topic}} scope.',
    promptRich:
      'Acknowledge {{firstName}}’s main point concisely, then gently surface a second-order risk or missing metric they have not named yet (e.g., silent regressions, team burnout cost, margin leakage, or legal/comp exposure—strictly matching {{topic}}) and ask how they monitor it early.'
  },

  // =========================================================================
  // STAGE 6: APPLIED CASE / SCREEN SHARE / NEGOTIATION (3 variations)
  // =========================================================================
  {
    id: 'case_screenshare_handoff',
    stage: 'applied_case',
    label: 'Natural Screen Share Case Handoff',
    tiers: ALL_TIERS,
    topics: CASE_TOPICS,
    complexityMin: 'rich',
    requiresScreenShare: true,
    provides: ['applied_exercise'],
    excludes: ['applied_exercise'],
    requiresAny: [],
    preferredNext: ['qa_candid_insider', 'qa_exec_mutual_diligence', 'qa_classic_team'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Wrap up the shared artifact discussion smoothly and hand the microphone to {{firstName}} for their questions.',
    promptLean:
      'React briefly to {{firstName}}’s last point and transition naturally to the shared Screen Share brief to ask what jumps out to them first.',
    promptRich:
      'React briefly to {{firstName}}’s answer, then bridge smoothly into collaborative problem-solving using the shared Screen Share artifact (if visible right now—reference concrete lines/metrics without reciting everything verbatim) and ask them to diagnose the top 1-2 bottlenecks or trade-offs.'
  },
  {
    id: 'case_verbal_triage',
    stage: 'applied_case',
    label: 'Verbal Live Scenario / Triage',
    tiers: ALL_TIERS,
    topics: CASE_TOPICS,
    complexityMin: 'rich',
    requiresScreenShare: false,
    provides: ['applied_exercise'],
    excludes: ['applied_exercise'],
    requiresAny: [],
    preferredNext: ['qa_candid_insider', 'qa_classic_team', 'qa_exec_mutual_diligence'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Tie off the quick scenario cleanly and transition naturally into opening the floor for {{firstName}}’s questions.',
    promptLean:
      'Acknowledge {{firstName}}’s previous point and walk through ONE short, realistic {{topic}}-scoped live scenario asking for their first 2 concrete moves.',
    promptRich:
      'React briefly, then bridge smoothly into a crisp verbal mini-scenario strictly fitted to {{topic}} and {{companyLabel}}: sketch a compact real-world dilemma in 2 sentences and ask {{firstName}} for their immediate triage sequence and stakeholder communication plan.'
  },
  {
    id: 'case_give_get_negotiation',
    stage: 'applied_case',
    label: 'Structured Give-Get Alignment',
    tiers: ALL_TIERS,
    topics: ['Negotiation'],
    complexityMin: 'standard',
    requiresScreenShare: false,
    provides: ['comp_alignment'],
    excludes: ['comp_alignment'],
    requiresAny: [],
    preferredNext: ['qa_classic_team', 'qa_exec_mutual_diligence'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Bridge from offer mechanics into giving {{firstName}} space to clarify any non-financial role or team questions.',
    promptLean:
      'React realistically to {{firstName}}’s expectation, share one realistic budget/equity constraint, and propose a constructive give-get trade-off.',
    promptRich:
      'Respond calmly and constructively to {{firstName}}’s position: validate the scope they bring, introduce a realistic compensation constraint (base band vs equity/performance bonus/sign-on/ramp timeline), and invite a creative give-get compromise.'
  },

  // =========================================================================
  // STAGE 7: REVERSE Q&A / DUE DILIGENCE (3 variations)
  // =========================================================================
  {
    id: 'qa_classic_team',
    stage: 'reverse_qa',
    label: 'Warm Reverse Q&A',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['reverse_qa'],
    excludes: ['reverse_qa'],
    requiresAny: [],
    preferredNext: ['close_warm_takeaway', 'close_logistics_smooth'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Answer concisely and transition smoothly into wrapping up the conversation.',
    promptLean:
      'React briefly to {{firstName}}’s previous answer, note there are a couple minutes left, and invite {{firstName}} to ask YOU questions about the role or team (within {{topic}} scope).',
    promptRich:
      'React concisely and warmly to {{firstName}}’s last point. Notice the clock naturally ("We have a few minutes left before we wrap—I want to flip the floor to you") and invite their questions about the team, roadmap, or role—answering candidly inside {{topic}} bounds if they have already asked one.'
  },
  {
    id: 'qa_candid_insider',
    stage: 'reverse_qa',
    label: 'Candid Inside-View Q&A',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['reverse_qa'],
    excludes: ['reverse_qa'],
    requiresAny: [],
    preferredNext: ['close_warm_takeaway', 'close_logistics_smooth', 'close_peer_exec_wrap'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Wrap up your candid answer cleanly and move into a warm closing.',
    promptLean:
      'React briefly, invite {{firstName}} to ask anything unvarnished about the team’s real challenges or day-to-day culture, and answer honestly inside {{topic}} bounds.',
    promptRich:
      'React briefly to {{firstName}}’s answer, then invite real curiosity rather than polite interview questions ("What’s something honest you’d want to know about how things actually run here day-to-day?"). Answer any question candidly without sugarcoating while respecting {{topic}} scope.'
  },
  {
    id: 'qa_exec_mutual_diligence',
    stage: 'reverse_qa',
    label: 'Executive Mutual Due Diligence',
    tiers: LEADER_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['reverse_qa', 'exec_diligence'],
    excludes: ['reverse_qa'],
    requiresAny: [],
    preferredNext: ['close_peer_exec_wrap', 'close_warm_takeaway'],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 2,
    bridgeOut: 'Close the mutual diligence exchange with peer-level crispness and outline clear next steps.',
    promptLean:
      'React briefly and open the floor for {{firstName}}’s leadership due diligence on team health, Board/CEO alignment, or mandate autonomy, answering candidly.',
    promptRich:
      'React concisely as a peer, then shift smoothly into EXECUTIVE MUTUAL DUE DILIGENCE ("Before we wrap, I want to leave genuine space for your own diligence—what do you need unvarnished clarity on regarding Board alignment, runway/trade-offs, or team autonomy?"). Answer candidly without corporate fluff.'
  },

  // =========================================================================
  // STAGE 8: WARM WRAP-UP & CLOSING (3 variations)
  // =========================================================================
  {
    id: 'close_warm_takeaway',
    stage: 'closing',
    label: 'Takeaway-Anchored Warm Close',
    tiers: ALL_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['closing'],
    excludes: ['closing'],
    requiresAny: [],
    preferredNext: [],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: '',
    promptLean:
      'React briefly to {{firstName}}’s last point/question, thank them warmly for their time, and share realistic next steps.',
    promptRich:
      'Respond concisely to {{firstName}}’s final question or thought, highlight ONE specific takeaway from what they shared today that stood out, thank them warmly for a grounded conversation, and outline realistic next steps in the loop.'
  },
  {
    id: 'close_logistics_smooth',
    stage: 'closing',
    label: 'Logistics & Next-Steps Close',
    tiers: ALL_TIERS,
    topics: ['HR', 'Negotiation', 'Behavioral'],
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['closing', 'logistics_confirm'],
    excludes: ['closing'],
    requiresAny: [],
    preferredNext: [],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: '',
    promptLean:
      'Respond concisely to {{firstName}}’s last point, quickly confirm availability or timeline if still open, thank them warmly, and share next steps.',
    promptRich:
      'Answer {{firstName}}’s final point concisely, then transition smoothly into wrapping up: confirm any remaining practical detail (notice period, remote cadence, or start window if still open), thank them warmly, and explain clear next steps.'
  },
  {
    id: 'close_peer_exec_wrap',
    stage: 'closing',
    label: 'Peer Executive Respectful Wrap',
    tiers: LEADER_TIERS,
    topics: ALL_TOPICS,
    complexityMin: 'lean',
    requiresScreenShare: false,
    provides: ['closing'],
    excludes: ['closing'],
    requiresAny: [],
    preferredNext: [],
    forbiddenNext: [],
    minTurns: 1,
    maxTurns: 1,
    bridgeOut: '',
    promptLean:
      'Acknowledge {{firstName}}’s closing point concisely as a peer, thank them for the candid discussion, and outline who they would meet next.',
    promptRich:
      'Respond thoughtfully to {{firstName}}’s closing remark at peer altitude, note appreciation for their candor on the mandate today, and clearly frame the next stakeholder conversation (e.g. Board/CEO/cross-functional peer) as you sign off warmly.'
  }
];

export const SCRIPT_BEAT_MAP = Object.freeze(
  Object.fromEntries(SCRIPT_BEATS.map((beat) => [beat.id, beat]))
);
