/**
 * Shared Interview "Screen Share" Technical Artifacts (`EXP-07`)
 * Only enabled in Technical, Live Coding, and System Design rounds.
 */

export const SCREEN_SHARE_TOPICS = new Set(['Technical', 'Live Coding', 'System Design']);

export const INTERVIEW_ARTIFACTS = [
  {
    id: 'ts-checkout-race',
    topics: ['Technical', 'Live Coding'],
    kind: 'Code Review · PR #418',
    title: 'Checkout Submit Hook — Duplicate Charge & Cleanup Bug',
    language: 'typescript',
    promptHint: 'Review state updates, abort safety, and idempotency around the async submit.',
    lines: [
      'export function useCheckoutSubmit(cartId: string) {',
      '  const [submitting, setSubmitting] = useState(false);',
      '  const [receipt, setReceipt] = useState<Receipt | null>(null);',
      '',
      '  const submitOrder = async () => {',
      '    setSubmitting(true);',
      '    const res = await fetch(`/api/checkout/${cartId}`, {',
      '      method: "POST",',
      '      body: JSON.stringify({ ts: Date.now() })',
      '    });',
      '    const data = await res.json();',
      '    setReceipt(data);',
      '    setSubmitting(false);',
      '  };',
      '',
      '  return { submitting, receipt, submitOrder };',
      '}'
    ]
  },
  {
    id: 'widget-bundle-leak',
    topics: ['Technical'],
    kind: 'Performance Trace · Production',
    title: '12KB Third-Party Embed — Memory & Bundle Regression',
    language: 'typescript',
    promptHint: 'Spot global listener leaks, DOM churn, and bundle bloat risks.',
    lines: [
      'import { cloneDeep } from "lodash";',
      '',
      'export function mountPromoBanner(root: HTMLElement, cfg: Config) {',
      '  const localCfg = cloneDeep(cfg);',
      '  const render = () => {',
      '    root.innerHTML = `<div class="promo">${localCfg.title}</div>`;',
      '  };',
      '  window.addEventListener("scroll", render);',
      '  window.addEventListener("resize", render);',
      '  render();',
      '}'
    ]
  },
  {
    id: 'lc-ttl-cache',
    topics: ['Live Coding', 'Technical'],
    kind: 'Live Coding Brief',
    title: 'Bounded LRU + TTL Cache (`get`, `set`, `evict`)',
    language: 'typescript',
    promptHint: 'Discuss O(1) operations, expired-key handling, and memory bounds.',
    lines: [
      'class TtlLruCache<K, V> {',
      '  constructor(private maxEntries: number, private defaultTtlMs: number) {}',
      '',
      '  get(key: K): V | undefined {',
      '    // TODO: check expiration, refresh recency, return undefined if stale',
      '  }',
      '',
      '  set(key: K, value: V, ttlMs = this.defaultTtlMs): void {',
      '    // TODO: overwrite cleanly, evict LRU entry if over maxEntries',
      '  }',
      '}'
    ]
  },
  {
    id: 'sd-rate-limiter',
    topics: ['System Design', 'Technical'],
    kind: 'Architecture Brief',
    title: 'Multi-Tenant Public API Rate Limiter (50k RPS)',
    language: 'text',
    promptHint: 'Explore distributed counters, Redis failure fallback, and noisy-neighbor isolation.',
    lines: [
      'Requirements:',
      '1. Enforce per-tenant burst + sustained quotas across 12 stateless edge regions.',
      '2. Target p99 overhead < 3 ms on the hot API Gateway path.',
      '3. Fail-open vs fail-closed behavior if Redis cluster experiences partial partition.',
      '4. Emit real-time 429 headers + audit metrics without blocking request threads.'
    ]
  },
  {
    id: 'sd-notif-fanout',
    topics: ['System Design'],
    kind: 'Architecture Diagram',
    title: 'Real-Time Webhook & Browser Push Fan-Out Pipeline',
    language: 'text',
    promptHint: 'Examine backpressure, ordering guarantees, dead-letter retries, and WS connection state.',
    lines: [
      '[Producer Services] -> [Kafka Topic: events.v1 (32 partitions)]',
      '        |--> [Webhook Workers] -> External URLs (retry w/ exp backoff + HMAC sig)',
      '        |--> [Presence Router] -> Redis Pub/Sub -> [WebSocket Gateways]',
      '',
      'Constraint: Tenant #42 bursts 400k events in 20s; slower tenants must NOT stall.'
    ]
  }
];

export function isScreenShareAllowedTopic(topic = '') {
  return SCREEN_SHARE_TOPICS.has(String(topic || '').trim());
}

export function getArtifactsForTopic(topic = 'Technical') {
  const t = String(topic || '').trim();
  if (!isScreenShareAllowedTopic(t)) return [];
  return INTERVIEW_ARTIFACTS.filter((a) => a.topics.includes(t));
}

export function findArtifactById(id) {
  return INTERVIEW_ARTIFACTS.find((a) => a.id === id) || null;
}
