// Curated 5 / 10 / 15-minute interview logic puzzles, Fermi estimations,
// deduction grids, weighing problems, and probabilistic brainteasers.
// `solutionGuide` stays strictly on the server so the AI tutor can guide
// collaboratively without spoiling the answer to the user's browser.

export const LOGIC_DIFFICULTIES = [
  { id: '5min', label: '⚡ 5 min · Easy Warm-up', minutes: 5 },
  { id: '10min', label: '🎯 10 min · Medium Interview', minutes: 10 },
  { id: '15min', label: '🔥 15 min · Hard Deep Think', minutes: 15 }
];

export const LOGIC_CATEGORIES = [
  { id: 'Deduction & Constraints', label: 'Deduction & Constraints' },
  { id: 'Timing & Optimization', label: 'Timing & Optimization' },
  { id: 'Weighing & Binary', label: 'Weighing & Binary Search' },
  { id: 'Fermi Estimation', label: 'Fermi Estimation' },
  { id: 'Probability & Game Theory', label: 'Probability & Game Theory' }
];

export const CURATED_LOGIC_PUZZLES = [
  // ================= 5 MIN · EASY =================
  {
    id: 'lp-3-switches',
    title: 'Three Switches & One Locked Room',
    difficulty: '5min',
    durationMinutes: 5,
    category: 'Deduction & Constraints',
    needsScratchpad: true,
    prompt:
      'You stand outside a closed, opaque door. On the wall beside you are 3 switches (A, B, C), all initially OFF. Inside the room are 3 standard incandescent light bulbs, each controlled by one switch. You may flip the switches however you like, then open the door and enter the room ONLY ONCE. How can you know with 100% certainty which switch controls which bulb?',
    constraints: [
      'You cannot see light under the door.',
      'You can enter the room only once and cannot touch the switches again after opening the door.',
      'Only 2 states exist from sight alone (ON/OFF) — look for another physical property!'
    ],
    scratchpadTemplate: `GOAL: Map Switches {A, B, C} -> Bulbs {1, 2, 3} with 1 room visit

Properties of a light bulb:
- Visual: ON / OFF
- ??? : 

Action Plan before opening door:
1. Switch A: 
2. Switch B: 
3. Switch C: 

Observations inside the room -> Mapping:`,
    hints: [
      'Sight alone only gives 2 states (lit vs. unlit), which is not enough for 3 bulbs. What else does an incandescent bulb emit?',
      'Think about time + temperature: what happens if one switch stays ON for 5 minutes and is then turned OFF right before you enter?'
    ],
    solutionGuide:
      'Turn Switch A ON for 5–10 minutes so its bulb heats up, then turn Switch A OFF. Turn Switch B ON, leave Switch C OFF, and walk inside. The lit bulb = B, the warm unlit bulb = A, the cold unlit bulb = C.'
  },
  {
    id: 'lp-3-labeled-boxes',
    title: 'Three Mislabelled Fruit Crates',
    difficulty: '5min',
    durationMinutes: 5,
    category: 'Deduction & Constraints',
    needsScratchpad: true,
    prompt:
      'Three opaque crates are labeled "Apples", "Oranges", and "Mixed (Apples & Oranges)". A mischievous warehouse clerk tells you: EVERY single label is guaranteed to be WRONG. You may reach into ONLY ONE crate and pull out ONE piece of fruit without looking inside. Which crate should you pick from, and how do you fix every label?',
    constraints: [
      'Every crate has the wrong label (0 labels are currently correct).',
      'You can draw only 1 single fruit from 1 single crate.'
    ],
    scratchpadTemplate: `Labels (ALL WRONG!):
- Crate labeled "Apples"   != Apples   -> must be {Oranges OR Mixed}
- Crate labeled "Oranges"  != Oranges  -> must be {Apples OR Mixed}
- Crate labeled "Mixed"    != Mixed    -> must be { ??? }

Pick 1 fruit from: 
If it is Apple -> conclusions:
If it is Orange -> conclusions:`,
    hints: [
      'If you pull an Apple from the crate labeled "Oranges", could that crate still be Mixed?',
      'Which crate CANNOT be Mixed, meaning a single fruit tells you its exact contents immediately?'
    ],
    solutionGuide:
      'Pick from the crate labeled "Mixed". Because its label is wrong, it cannot contain Mixed fruit—it is pure Apples or pure Oranges. Suppose you draw an Apple: that crate MUST be Apples. Then the crate labeled "Oranges" cannot be Oranges (wrong label) and cannot be Apples (already taken), so it MUST be Mixed. The crate labeled "Apples" must then be Oranges.'
  },
  {
    id: 'lp-9-balls',
    title: 'Nine Billiard Balls & Balance Scale',
    difficulty: '5min',
    durationMinutes: 5,
    category: 'Weighing & Binary',
    needsScratchpad: true,
    prompt:
      'You have 9 identical-looking billiard balls. Exactly 1 ball is slightly heavier than the other 8 (which all weigh the same). Using a classic two-pan balance scale ONLY TWICE, how do you guarantee finding the heavier ball?',
    constraints: [
      'Maximum 2 weighings total.',
      'A balance scale gives 3 possible outcomes per weighing: Left heavier, Right heavier, or Equal.'
    ],
    scratchpadTemplate: `Balls: [1, 2, 3, 4, 5, 6, 7, 8, 9]

Weighing 1 (Left vs Right, Leave Aside):
- Left: 
- Right: 
- Aside: 

Case A (Left == Right) -> Weighing 2:
Case B (Left != Right) -> Weighing 2:`,
    hints: [
      'Notice a balance scale has 3 outcomes (<, =, >), not 2! So 3^2 = 9 cases can be distinguished in 2 weighings.',
      'Try splitting the 9 balls into 3 equal groups of 3.'
    ],
    solutionGuide:
      'Weighing 1: weigh [1,2,3] vs [4,5,6], leaving [7,8,9] aside. Equal -> heavy is in [7,8,9]; otherwise take the heavier trio. Weighing 2: weigh 1 vs 1 from that suspect trio (leaving 1 aside). Equal -> the unweighed one is heavy; heavier pan -> that ball is heavy.'
  },
  {
    id: 'lp-ants-stick',
    title: 'Fifty Ants on a One-Meter Stick',
    difficulty: '5min',
    durationMinutes: 5,
    category: 'Probability & Game Theory',
    needsScratchpad: true,
    prompt:
      'Fifty ants are placed at arbitrary positions along a 1-meter narrow wooden stick. Each ant walks at a constant speed of 1 meter per minute (either left or right). Whenever two ants collide head-on, both instantaneously bounce and reverse direction. When an ant reaches either end, it falls off. What is the maximum possible time until ALL ants have fallen off?',
    constraints: [
      'Speed is always 1 m/min.',
      'Collisions happen instantaneously; ignore ant body widths.'
    ],
    scratchpadTemplate: `Stick length = 1 meter, speed = 1 m/min

Before collision:  Ant X --->  <--- Ant Y
After bounce:      <--- Ant X  Ant Y --->

Insight (What if ants passed right through each other without bouncing?):
Max distance any "identity" can travel = `,
    hints: [
      'Think about what happens to the set of moving dots if you ignore which ant is which during a collision.',
      'When two identical ants bounce off each other, is the physical motion any different from them simply passing through each other?'
    ],
    solutionGuide:
      '1 minute. Bouncing off each other is mathematically identical to two ants simply passing straight through one another (if you do not care about individual ant labels). Thus every "moving ant token" just walks straight at 1 m/min for at most the full 1-meter stick length = 1 minute maximum.'
  },

  // ================= 10 MIN · MEDIUM =================
  {
    id: 'lp-burning-ropes',
    title: 'Two Non-Uniform Ropes (45 Minutes)',
    difficulty: '10min',
    durationMinutes: 10,
    category: 'Timing & Optimization',
    needsScratchpad: true,
    prompt:
      'You have two fuses/ropes and a lighter. Each rope takes EXACTLY 60 minutes to burn completely from one end to the other, EXCEPT they burn at completely uneven, non-uniform speeds (so half a rope by length does NOT take 30 minutes). How do you measure exactly 45 minutes?',
    constraints: [
      'You cannot fold or cut a rope and assume half length = half time.',
      'You can light either or both ends of a rope at any moment.'
    ],
    scratchpadTemplate: `Each full rope = 60 min burn time (uneven density!)
Trick: What happens if BOTH ends of one rope are lit simultaneously?

t = 0 min:
- Rope A: 
- Rope B: 

t = ??? min (event triggers next step):
- Action: 

Total elapsed = 45 min CHECK:`,
    hints: [
      'Even if a rope burns irregularly, lighting BOTH ends at the same time means the two flames meet after half the total burn time: 30 minutes.',
      'Can you start Rope B burning from ONE end at t = 0 so that at t = 30 min it has 30 minutes of fuel left?'
    ],
    solutionGuide:
      'At t=0: light BOTH ends of Rope A and ONE end of Rope B. When Rope A finishes burning completely, exactly 30 minutes have elapsed, and Rope B has 30 minutes of burn time left. Immediately light the OTHER end of Rope B; burning from both ends consumes the remaining 30 minutes in 15 minutes. 30 + 15 = 45 minutes.'
  },
  {
    id: 'lp-bridge-torch',
    title: 'Night Bridge Crossing (17 Minutes)',
    difficulty: '10min',
    durationMinutes: 10,
    category: 'Timing & Optimization',
    needsScratchpad: true,
    prompt:
      'Four engineers (A, B, C, D) must cross a dark, rickety bridge at night. At most TWO people can cross at once, and anyone crossing MUST carry their single flashlight (so someone must walk it back). Their individual crossing speeds are: A = 1 min, B = 2 min, C = 5 min, D = 10 min. A pair walks at the slower person’s pace. How do all four cross in 17 minutes or less?',
    constraints: [
      'Bridge max capacity = 2 people.',
      'Only 1 flashlight; cannot be thrown across.',
      'Total budget <= 17 minutes.'
    ],
    scratchpadTemplate: `Left Bank: {A:1, B:2, C:5, D:10} | Torch: Left | Right Bank: {}

Naive greedy (A escorts everyone) = 2+1 + 5+1 + 10 = 19 min (TOO SLOW!)

Key insight: C(5) and D(10) should cross TOGETHER so C does not add 5 extra minutes!
Wait — if C & D cross together, who brings the torch back without C or D returning?

Trip 1 (->):                    Time:
Trip 2 (<-):                    Time:
Trip 3 (->):                    Time:
Trip 4 (<-):                    Time:
Trip 5 (->):                    Time:
TOTAL <= 17 min:`,
    hints: [
      'The naive approach uses A(1) to shuttle everyone, which wastes 19 minutes because C(5) and D(10) cross separately.',
      'Pair C(5) and D(10) together! Just make sure one of the fast walkers (B) is already waiting on the Right bank to bring the torch back.'
    ],
    solutionGuide:
      '1) A+B cross (2m). 2) A returns with torch (1m). 3) C+D cross together (10m). 4) B returns with torch (2m). 5) A+B cross together (2m). Total = 2 + 1 + 10 + 2 + 2 = 17 minutes.'
  },
  {
    id: 'lp-fermi-api-traffic',
    title: 'Fermi: Global Daily HTTP Requests for a Ride-Share App',
    difficulty: '10min',
    durationMinutes: 10,
    category: 'Fermi Estimation',
    needsScratchpad: true,
    prompt:
      'In a backend / product interview, the interviewer asks: "Estimate the total number of HTTP/WebSocket location & API requests processed globally per second during peak hours by a major ride-hailing app like Uber." Walk through clean assumptions, formulas, and a sanity check on the scratchpad.',
    constraints: [
      'Clearly separate active riders, active drivers, idle app users, and request frequency.',
      'Use clean powers of 10 / round approximations you can compute mentally.',
      'End with a Requests-Per-Second (RPS) number AND a sanity check.'
    ],
    scratchpadTemplate: `Formula: Total Peak RPS = Driver RPS + Rider Tracking RPS + Browsing/Booking RPS

1. Daily Rides Globally:
   - Population / Urban users:
   - Daily trips estimate:

2. Peak Concurrency:
   - Avg ride duration (min):
   - Concurrent active rides (peak factor):
   - Active idle/cruising drivers:

3. Request Cadence (requests/sec per entity):
   - Driver GPS ping interval:
   - Rider live map poll interval:

4. Final Peak RPS + Order-of-Magnitude Sanity Check:`,
    hints: [
      'Think bottom-up from daily trips (e.g. ~20–30 million rides/day globally) -> rides/sec -> multiply by average trip duration (~20 min = 1,200s) to get concurrent rides (Little’s Law!).',
      'Remember Drivers send GPS updates even while idle between rides, and peak rush hour can be ~2–3x the daily average.'
    ],
    solutionGuide:
      'Strong clean model (~30M rides/day -> ~350 rides/sec avg -> ~700–1000 rides/sec peak). Using Little’s Law with ~15–20 min (~1000s) avg trip -> ~0.7M–1M concurrent active rides, plus ~1.5M–2M active drivers cruising. If drivers ping every 4s (~0.25 RPS each) and riders/browse traffic adds another ~0.25–0.5 RPS per active trip -> roughly 500k to 1.5M peak RPS globally. Evaluators grade structure, Little’s Law awareness, peak multiplier, and sanity-checking.'
  },
  {
    id: 'lp-knights-knaves',
    title: 'Island of Knights, Knaves & Truth Logic',
    difficulty: '10min',
    durationMinutes: 10,
    category: 'Deduction & Constraints',
    needsScratchpad: true,
    prompt:
      'On the Island of Knights and Knaves, Knights ALWAYS tell the truth and Knaves ALWAYS lie. You meet three locals: Alex, Blake, and Casey. Alex says: "Exactly one of us is a Knight." Blake says: "Alex is lying." Casey says: "Blake and I are of the SAME type." Determine what Alex, Blake, and Casey each are — with full proof.',
    constraints: [
      'Every inhabitant is either a Knight (100% truth) or a Knave (100% false).',
      'Look at pairs of contradictory statements first.'
    ],
    scratchpadTemplate: `Rules: Knight = ALWAYS TRUE | Knave = ALWAYS FALSE

Statements:
- Alex:  "Exactly 1 of {Alex, Blake, Casey} is a Knight."
- Blake: "Alex is a Knave (lying)."
- Casey: "Blake and Casey are the SAME type."

Key deduction on {Alex, Blake}:
Since Blake directly contradicts Alex -> Exactly ONE of {Alex, Blake} is a Knight!

Case 1: Assume Alex = Knight (so Blake = Knave):
Case 2: Assume Alex = Knave (so Blake = Knight):

Final Assignment:`,
    hints: [
      'Blake says "Alex is lying." That means Alex and Blake CANNOT both be Knights and CANNOT both be Knaves!',
      'So among {Alex, Blake}, there is ALREADY exactly one Knight. Now test what Alex said ("Exactly one of all 3 is a Knight")!'
    ],
    solutionGuide:
      'Blake directly denies Alex’s truthfulness -> one of {Alex, Blake} is a Knight and the other is a Knave. Case 1: Suppose Alex is a Knight -> Alex’s claim ("exactly 1 Knight total") forces Casey to be a Knave, while Blake is also a Knave. Check Casey: Casey says "Blake and I are the same type." Both Blake and Casey are Knaves, so Casey told the TRUTH! Contradiction (a Knave cannot tell the truth). Case 2: Therefore Alex is a Knave and Blake is a Knight. Since Alex lied, the number of Knights is NOT 1 (so >1). If Casey is a Knight, Casey says Blake & Casey are same type -> TRUE (both Knights)! Result: Alex = Knave, Blake = Knight, Casey = Knight.'
  },

  // ================= 15 MIN · HARD =================
  {
    id: 'lp-1000-wine',
    title: '1,000 Wine Bottles & 10 Test Strips (Binary Encoding)',
    difficulty: '15min',
    durationMinutes: 15,
    category: 'Weighing & Binary',
    needsScratchpad: true,
    prompt:
      'A king has 1,000 bottles of vintage wine. An assassin poisoned EXACTLY ONE bottle with a drop of slow-acting toxin. You have 10 chemical test strips (each reacts 24 hours after exposure and can detect tiny mixed drops). The banquet starts in 24 hours — so you get ONLY ONE testing round! How do you identify the exact poisoned bottle out of 1,000?',
    constraints: [
      'Only 1 round of testing is allowed (no sequential rounds).',
      'You can mix drops from multiple bottles onto the same test strip.',
      '2^10 = 1024.'
    ],
    scratchpadTemplate: `Bottles: 0..999 (1,000 bottles total)
Test strips: S9 S8 S7 S6 S5 S4 S3 S2 S1 S0  (10 bits -> 2^10 = 1024 patterns!)

Encoding rule for bottle #N:
- Example Bottle #0  = 0000000000 -> Strips:
- Example Bottle #1  = 0000000001 -> Strips:
- Example Bottle #5  = 0000000101 -> Strips:
- Example Bottle #13 = 0000001101 -> Strips:

Decoding after 24 hours:
Suppose S3, S2, S0 turn positive (1) and the rest stay negative (0) -> Bottle #:`,
    hints: [
      'Each test strip gives 1 bit of information after 24 hours (Positive / Negative). With 10 strips, how many unique bit patterns exist?',
      'Label every bottle from 0 to 999 in 10-bit binary! If bit k of bottle N is 1, put a drop of bottle N onto strip k.'
    ],
    solutionGuide:
      'Assign each bottle a binary number from 0 to 999 (10 bits, since 2^10 = 1024 >= 1000). For each bottle N, place one drop onto every strip i where bit i of N is 1. After 24 hours, read the positive strips as 1s and negative strips as 0s — that 10-bit binary integer is the exact poisoned bottle number (bottle 0 triggers no strips).'
  },
  {
    id: 'lp-25-horses',
    title: '25 Racehorses & 5-Lane Track (Top 3 Fastest)',
    difficulty: '15min',
    durationMinutes: 15,
    category: 'Timing & Optimization',
    needsScratchpad: true,
    prompt:
      'You have 25 horses and a racetrack with 5 lanes, meaning at most 5 horses can race together at once. You do NOT have a stopwatch — you only observe the relative finishing order (1st..5th) within each heat. What is the MINIMUM number of races required to find the overall Top 3 fastest horses (in exact order 1st, 2nd, 3rd)? Prove why.',
    constraints: [
      'No absolute times/stopwatches.',
      'No ties; speeds are deterministic and transitive (if A > B and B > C, then A > C).'
    ],
    scratchpadTemplate: `25 horses = 5 groups of 5: {G1, G2, G3, G4, G5}

Step 1 (Races 1..5): Race each group of 5.
Rank inside each group: (1st, 2nd, 3rd, 4th, 5th) -> Who can IMMEDIATELY be eliminated?

Step 2 (Race 6): Race the 5 group winners: [G1_1, G2_1, G3_1, G4_1, G5_1]
Assume result is G1_1 > G2_1 > G3_1 > G4_1 > G5_1.
- Who is guaranteed Overall #1?
- Eliminate everyone who already has >= 3 horses strictly faster than them!
Remaining candidates for Overall #2 and #3:

Step 3 (Race 7): Who races in Race 7?`,
    hints: [
      '5 races split the 25 horses into 5 ranked groups. In each group, horses #4 and #5 already have 3 faster horses ahead of them — eliminate them! Then race the 5 group winners in Race 6.',
      'Assume Race 6 finishes G1_1 > G2_1 > G3_1 > G4_1 > G5_1. G1_1 is #1 overall. Count how many horses are already strictly faster than G3_2, G2_3, and G4_1!'
    ],
    solutionGuide:
      '7 races minimum. Races 1–5: race 5 groups (A..E). Race 6: race the 5 winners (say A1 > B1 > C1 > D1 > E1). Thus A1 is #1 overall. D1, E1 (and their groups) have at least 3 faster horses ahead, so eliminated. C2, C3, B3 also have >=3 faster horses ahead (e.g. A1, B1, C1 beat C2). Only 5 horses remain eligible for #2 and #3: [A2, A3, B1, B2, C1]. Race those 5 together in Race 7 -> the top 2 of Race 7 are overall #2 and #3!'
  },
  {
    id: 'lp-100-floors-2-eggs',
    title: 'Two Eggs & 100-Floor Building (Worst-Case Minimax)',
    difficulty: '15min',
    durationMinutes: 15,
    category: 'Probability & Game Theory',
    needsScratchpad: true,
    prompt:
      'You are given 2 identical glass eggs and a 100-story building. An egg breaks if dropped from floor F or higher, and survives unbroken below floor F (including if dropped multiple times safely). Find a dropping strategy that MINIMIZES the WORST-CASE number of drops needed to determine the exact critical floor F.',
    constraints: [
      'If Egg 1 breaks on a floor, you must walk linearly upward floor-by-floor with Egg 2.',
      'Aim for an exact optimal worst-case drop count (better than binary search or fixed 10-step intervals!).'
    ],
    scratchpadTemplate: `Why fixed step-size 10 (10, 20, ..., 100) isn't optimal:
Worst case at floor 99 = 10 drops (Egg 1) + 9 drops (Egg 2) = 19 drops.

Minimax Balancing Principle:
If max worst-case drops = X, then each safe jump reduces our remaining budget by 1!
- Drop 1 at floor X: if breaks, Egg 2 checks floors 1..(X-1) -> X-1 drops -> Total X!
- If survives, next step size must be (X - 1), then (X - 2)...

Equation:
X + (X - 1) + (X - 2) + ... + 1 >= 100
X * (X + 1) / 2 >= 100 -> Solve for integer X:

Starting floors sequence:`,
    hints: [
      'Fixed intervals like 10, 20, ..., 100 waste potential early (10 drops max if it breaks at floor 10, vs 19 drops at floor 99). Can you keep total worst-case drops CONSTANT regardless of which interval breaks?',
      'Decrease the step size by 1 after every safe drop: x + (x-1) + (x-2) + ... + 1 >= 100.'
    ],
    solutionGuide:
      '14 drops worst-case! Balance the worst-case budget so every interval equals x total drops: x(x+1)/2 >= 100 -> x = 14 (since 14*15/2 = 105 >= 100). Start at floor 14, then jump +13 -> 27, +12 -> 39, +11 -> 50, +10 -> 60, +9 -> 69, +8 -> 77, +7 -> 84, +6 -> 90, +5 -> 95, +4 -> 99, +1 -> 100.'
  },
  {
    id: 'lp-100-prisoners-bulb',
    title: '100 Prisoners & The Single Lightbulb Protocol',
    difficulty: '15min',
    durationMinutes: 15,
    category: 'Deduction & Constraints',
    needsScratchpad: true,
    prompt:
      'A warden puts 100 prisoners in solitary cells and explains a room containing 1 lightbulb (initially OFF). Each day, the warden picks ONE prisoner at random (uniformly, WITH replacement — a prisoner may enter many times or wait days) to enter the room. That prisoner can toggle the bulb or leave it unchanged. Any prisoner who declares "All 100 prisoners have entered at least once" wins freedom for everyone if true, or doom if false. Before starting, prisoners meet once to agree on a protocol. How do they guarantee 100% victory?',
    constraints: [
      'Prisoners cannot communicate after Day 1 begins, except via the single 1-bit lightbulb state.',
      'Random selection WITH replacement means any prisoner can enter multiple times.'
    ],
    scratchpadTemplate: `State available: 1 bit (Lightbulb ON or OFF, initially OFF).
Random picks WITH replacement -> Same prisoner can enter twice!

Why "turn ON once per prisoner" alone fails without a Counter:
Who keeps the count safely?

Roles Protocol:
1. Designated Counter (1 prisoner):
   - Action when bulb is ON:
   - Action when bulb is OFF:
   - Victory condition (count == ?):

2. Standard Prisoners (the other 99):
   - Track personal boolean: hasFlipped = false
   - Action when bulb is OFF AND !hasFlipped:
   - Action otherwise:`,
    hints: [
      'A single light bulb only remembers 1 bit unless ONE chosen person maintains the running count inside their head.',
      'Elect 1 prisoner as the "Counter" and 99 as "Signallers". What rule prevents a signaller from being counted twice by accident?'
    ],
    solutionGuide:
      'Designate 1 prisoner as the Counter (starts count = 0) and the other 99 as Signallers. Rule for a Signaller: ONLY if the bulb is OFF AND they have NEVER turned it ON before, turn it ON (and remember they did so). Otherwise touch nothing. Rule for the Counter: whenever they enter and see the bulb ON, turn it OFF and increment count += 1. Once the Counter reaches count == 99, all 99 others + the Counter have definitely visited at least once -> safely declare victory!'
  }
];

export function sanitizeLogicPuzzleForClient(puzzle) {
  if (!puzzle) return null;
  return {
    id: puzzle.id,
    title: puzzle.title,
    difficulty: puzzle.difficulty,
    durationMinutes: Number(puzzle.durationMinutes || 10),
    category: puzzle.category,
    needsScratchpad: Boolean(puzzle.needsScratchpad !== false),
    prompt: puzzle.prompt,
    constraints: Array.isArray(puzzle.constraints) ? puzzle.constraints : [],
    scratchpadTemplate: puzzle.scratchpadTemplate || '',
    isCustom: Boolean(puzzle.isCustom)
  };
}

export function getPublicLogicPuzzles(extraPuzzles = []) {
  const all = [...(extraPuzzles || []), ...CURATED_LOGIC_PUZZLES];
  return all.map(sanitizeLogicPuzzleForClient);
}

export function findLogicPuzzle(id, extraPuzzles = []) {
  return [...(extraPuzzles || []), ...CURATED_LOGIC_PUZZLES].find((p) => p.id === id) || CURATED_LOGIC_PUZZLES[0];
}
