/**
 * Built-In Language, Mobile, Web, Data & Cloud Technology Deep Knowledge Base (20 Stacks)
 * Injects exact runtime invariants, concurrency traps, and probe questions matching CV + JD + Role Track.
 */

export const TECH_STACK_KBS = {
  typescript: {
    id: 'typescript',
    label: 'TypeScript / JS',
    category: 'web',
    keywords: ['typescript', 'ts', 'javascript', 'es6', 'ecmascript'],
    pitfalls: 'Structural typing leaks, unchecked `any`/`as` casts at network boundaries, closure/timer memory leaks, Event Loop microtask starvation.',
    probe: 'Test runtime schema validation (Zod/Valibot) at API edges, discriminated union exhaustiveness (`never`), and chunking long main-thread tasks.'
  },
  nodejs: {
    id: 'nodejs',
    label: 'Node.js Runtime & BFF',
    category: 'backend',
    keywords: ['node.js', 'nodejs', 'express', 'fastify', 'nestjs', 'libuv'],
    pitfalls: 'Blocking single-threaded Event Loop with sync crypto/JSON/regex, ignoring Stream backpressure (`highWaterMark`) causing OOM, unhandled promise rejections.',
    probe: 'Probe Worker Threads vs cluster mode, `pipeline()` backpressure, BFF HttpOnly cookie auth, graceful SIGTERM HTTP drain, and heap snapshot leak debugging.'
  },
  react: {
    id: 'react',
    label: 'React / Next.js',
    category: 'web',
    keywords: ['react', 'next.js', 'nextjs', 'redux', 'zustand', 'hooks', 'jsx', 'tsx'],
    pitfalls: 'Stale closures in `useEffect`/`setInterval`, derived-state `useEffect` cascades, unstable keys, context re-render storms, SSR hydration mismatches.',
    probe: 'Challenge premature `useMemo` vs state colocation, preventing async fetch race overwrites (`AbortController`), and RSC vs Client bundle splits.'
  },
  vue: {
    id: 'vue',
    label: 'Vue 3 / Nuxt',
    category: 'web',
    keywords: ['vue', 'vue3', 'nuxt', 'pinia', 'vuex', 'vite'],
    pitfalls: 'Destructuring `reactive()` losing proxy reactivity (`toRefs`), deep watcher perf cliffs, Nuxt SSR shared-state cross-request leaks.',
    probe: 'Drill `ref` vs `reactive`, `computed` caching vs `watchEffect`, Pinia SSR hydration safety, and fine-grained component lazy loading.'
  },
  lit: {
    id: 'lit',
    label: 'Lit / Web Components',
    category: 'web',
    keywords: ['lit', 'web components', 'shadow dom', 'custom elements', 'lit-element', 'lit-html'],
    pitfalls: 'Host page CSS leakage or font inheritance breaking inside Shadow DOM, global listener leaks missing `disconnectedCallback` cleanup, heavy embed bundle.',
    probe: 'Probe Shadow DOM theming (`::part()`, CSS custom properties), `willUpdate` vs `updated`, and keeping merchant embeds <15KB gzipped.'
  },
  angular: {
    id: 'angular',
    label: 'Angular / RxJS',
    category: 'web',
    keywords: ['angular', 'rxjs', 'ngrx', 'signals', 'nx'],
    pitfalls: 'Default ChangeDetection sweeping large trees, unsubscribed Observables leaking memory, `switchMap` cancelling non-idempotent payment writes (must be `exhaustMap`).',
    probe: 'Drill `switchMap` vs `exhaustMap` vs `concatMap`, Signals fine-grained reactivity vs Zone.js, `takeUntilDestroyed()`, and Nx module boundaries.'
  },
  java: {
    id: 'java',
    label: 'Java & Spring Boot',
    category: 'backend',
    keywords: ['java', 'jvm', 'spring', 'spring boot', 'hibernate', 'jpa', 'hikari', 'kafka'],
    pitfalls: 'Spring `@Transactional` self-invocation proxy bypass, holding DB locks across HTTP calls, Hibernate N+1 lazy loads, Virtual Threads pinning inside `synchronized`.',
    probe: 'Ask about HikariCP pool sizing (Little’s Law), Transactional Outbox vs `@Transactional` HTTP calls, Spring Security filter chain order, and G1GC vs ZGC.'
  },
  dotnet: {
    id: 'dotnet',
    label: 'C# & .NET Core',
    category: 'backend',
    keywords: ['c#', '.net', 'dotnet', 'asp.net', 'ef core', 'entity framework', 'kestrel', 'blazor'],
    pitfalls: 'Sync-over-async (`.Result`/`.Wait()`) starving Kestrel threads, socket/DNS exhaustion from `new HttpClient()`, EF nested `.Include()` Cartesian explosion, LOH Gen2 spikes.',
    probe: 'Probe `Span<T>`/`ArrayPool<T>` zero-alloc paths, typed `IHttpClientFactory`, EF `AsNoTracking()` + Split Queries, and `DbContext` thread-safety.'
  },
  python: {
    id: 'python',
    label: 'Python / FastAPI / AI',
    category: 'backend',
    keywords: ['python', 'fastapi', 'django', 'flask', 'pydantic', 'celery', 'asyncio', 'pytorch', 'langchain'],
    pitfalls: 'Blocking `requests.get()` or CPU pandas inside FastAPI `async def` freezing the event loop, untyped dict soups, LLM RAG shipped without recall/TTFT evals.',
    probe: 'Test GIL vs AsyncIO vs multiprocessing, async SQLAlchemy sessions, Celery DLQ idempotency, and hybrid RAG + deterministic evaluation harnesses.'
  },
  go: {
    id: 'go',
    label: 'Go (Golang)',
    category: 'backend',
    keywords: ['golang', 'goroutine', 'grpc', 'protobuf', 'errgroup', 'pprof'],
    pitfalls: 'Goroutine leaks on unbuffered channels when `context` cancels, `http.DefaultClient` having ZERO timeout, slice backing-array aliasing, data races.',
    probe: 'Drill `context` cancellation, bounded `errgroup` pools, graceful `http.Server.Shutdown`, `sync.Mutex` vs channels, and `-race` / `pprof` escape analysis.'
  },
  rust: {
    id: 'rust',
    label: 'Rust / Tokio',
    category: 'backend',
    keywords: ['rust', 'tokio', 'cargo', 'actix', 'axum', 'serde', 'wasm'],
    pitfalls: 'Holding `std::sync::MutexGuard` across a `tokio` `.await` (deadlock/`!Send`), `.unwrap()` panics on prod input, excessive `.clone()` fighting borrow checker.',
    probe: 'Test `tokio::sync::Mutex` vs `std::sync::Mutex`, zero-copy `&str` lifetimes, `Send + Sync` bounds, `spawn_blocking`, and `thiserror` vs `anyhow`.'
  },
  cpp: {
    id: 'cpp',
    label: 'C / C++20 Systems',
    category: 'backend',
    keywords: ['c++', 'cpp', 'c++20', 'raii', 'cmake', 'embedded', 'rtos'],
    pitfalls: 'Dangling `std::string_view`, `shared_ptr` atomic refcount contention & cycles, multi-core cache-line false sharing, undefined behavior without ASan/TSan.',
    probe: 'Drill RAII / Rule of Zero, `unique_ptr` ownership, `alignas(64)` cache locality, `std::memory_order` acquire/release, and `perf`/sanitizer workflows.'
  },
  swift: {
    id: 'swift',
    label: 'Swift & SwiftUI (iOS)',
    category: 'mobile',
    keywords: ['swift', 'swiftui', 'uikit', 'ios', 'xcode', 'combine', 'mainactor'],
    pitfalls: 'Closure retain cycles, `[unowned self]` async crashes, UI updates off `@MainActor`, actor reentrancy firing duplicate refreshes across `await`.',
    probe: 'Ask about Swift structured concurrency (`Sendable`, actor reentrancy coalescing), SwiftUI `@Observable` redraws, Instruments Leaks, and Keychain auth.'
  },
  objc: {
    id: 'objc',
    label: 'Objective-C & Apple Runtime',
    category: 'mobile',
    keywords: ['objective-c', 'obj-c', 'objc', 'cocoa', 'autoreleasepool', 'kvo', 'foundation'],
    pitfalls: 'Block retain cycles missing `__weak typeof(self)` + strongify dance, `_Nullable` Swift bridge crashes, leaked KVO observers, media loops lacking `@autoreleasepool`.',
    probe: 'Drill Swift/Obj-C bridging headers & `@objc`, `weak` vs `__unsafe_unretained`, dispatch queues vs atomic properties, and method swizzling risks.'
  },
  kotlin: {
    id: 'kotlin',
    label: 'Kotlin & Android (Compose)',
    category: 'mobile',
    keywords: ['kotlin', 'android', 'jetpack compose', 'coroutines', 'stateflow', 'workmanager', 'room'],
    pitfalls: 'Orphaned `GlobalScope` coroutines leaking Activities, unstable lambdas causing Compose recomposition jank, main-thread disk ANRs, losing state on OS process death.',
    probe: 'Drill `repeatOnLifecycle`, `StateFlow` vs `SharedFlow`, Compose `@Immutable`/Baseline Profiles, `SavedStateHandle` + Room/WorkManager offline sync, and R8.'
  },
  reactnative: {
    id: 'reactnative',
    label: 'React Native (JSI / Fabric)',
    category: 'mobile',
    keywords: ['react native', 'expo', 'hermes', 'jsi', 'reanimated', 'metro'],
    pitfalls: 'Choking legacy JSON bridge on scroll/gestures, JS-thread animation drops, `FlatList` memory spikes on unresized images, ABI-breaking OTA updates.',
    probe: 'Push on New Architecture (JSI C++, Fabric, TurboModules), Reanimated UI worklets, Hermes TTI startup, FlashList recycling, and EAS/OTA safety.'
  },
  cordova: {
    id: 'cordova',
    label: 'Cordova / Ionic / Capacitor',
    category: 'mobile',
    keywords: ['cordova', 'capacitor', 'ionic', 'phonegap', 'wkwebview', 'hybrid mobile'],
    pitfalls: '`WKWebView` OS memory kills, `capacitor://` CORS/cookie restrictions, plugin work blocking WebView UI thread, `localStorage` eviction vs native SQLite.',
    probe: 'Probe JS-to-Native plugin bridge serialization, iOS safe-area/keyboard jumps, native SQLite/SecureStorage persistence, and migrating legacy Cordova plugins.'
  },
  flutter: {
    id: 'flutter',
    label: 'Flutter / Dart',
    category: 'mobile',
    keywords: ['flutter', 'dart', 'riverpod', 'bloc', 'impeller', 'skia', 'drift'],
    pitfalls: '`jsonDecode`/crypto on UI isolate blowing 16.6ms frame budget, `Opacity`/`saveLayer` overdraw, global Bloc rebuild storms, parallel 401 offline races.',
    probe: 'Drill `Isolate.run()`, `.select()` rebuild bounds, `RepaintBoundary` in DevTools, Drift local SQLite source of truth, and Pigeon/MethodChannel bridges.'
  },
  sql: {
    id: 'sql',
    label: 'SQL / PostgreSQL Internals',
    category: 'data',
    keywords: ['postgres', 'postgresql', 'mysql', 'sql', 'mvcc', 'indexing', 'pgbouncer'],
    pitfalls: 'Wrong composite B-tree column order, `OFFSET 50000` O(N) scans, long transactions blocking MVCC autovacuum, lock deadlocks under concurrent updates.',
    probe: 'Probe `EXPLAIN (ANALYZE, BUFFERS)`, covering indexes, keyset pagination, `SELECT ... FOR UPDATE SKIP LOCKED`, and connection pooling (PgBouncer).'
  },
  cloud: {
    id: 'cloud',
    label: 'AWS / Kubernetes / Terraform',
    category: 'infra',
    keywords: ['kubernetes', 'k8s', 'aws', 'gcp', 'terraform', 'docker', 'helm', 'istio'],
    pitfalls: 'Wiring K8s liveness probe to check Postgres (cascading fleet restart!), monolithic Terraform state blast radius, static CI keys instead of OIDC, NAT/egress cost spikes.',
    probe: 'Drill readiness vs liveness vs startup probes, PDB/HPA tuning, layered Terraform state isolation, IAM least privilege, and multi-window SLO burn alerts.'
  }
};

export const DEFAULT_TECH_STACK_MAP = {
  frontend: ['typescript', 'react', 'lit', 'vue'],
  java: ['java', 'sql'],
  dotnet: ['dotnet', 'sql'],
  python: ['python', 'sql'],
  php: ['sql', 'typescript'],
  go: ['go', 'sql'],
  rust: ['rust', 'cpp'],
  cpp: ['cpp', 'rust'],
  ios: ['swift', 'objc'],
  android: ['kotlin'],
  mobile: ['reactnative', 'cordova', 'flutter'],
  flutter: ['flutter'],
  qa: ['typescript', 'react'],
  devops: ['cloud', 'go'],
  data: ['sql', 'python'],
  security: ['typescript', 'cloud', 'sql'],
  solutions: ['nodejs', 'cloud', 'sql'],
  techlead: ['typescript', 'sql', 'cloud'],
  general: ['typescript', 'nodejs', 'sql']
};

export function getAllTechStackKbs() {
  return Object.values(TECH_STACK_KBS);
}

/**
 * Pick 1-3 exact technology micro-KBs from candidate CV + Target JD + active Role Track.
 * Non-coding / Executive / People / Product / CS roles skip IC coding stack injection completely.
 */
export function detectRelevantTechStacks({ archKey = 'general', cvText = '', coreStack = [], jdText = '', maxCount = 2 } = {}) {
  const nonCodeRoles = new Set(['ceo', 'coo', 'cto', 'cfo', 'cro', 'em', 'pm', 'po', 'design', 'marketing', 'tpm', 'csm', 'people']);
  if (nonCodeRoles.has(archKey)) return [];

  const haystack = `${coreStack.join(' ')} ${jdText} ${String(cvText || '').slice(0, 4500)}`.toLowerCase();
  const hasWord = (kw) => {
    const escaped = String(kw).trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9+#.])${escaped}([^a-z0-9+#.]|$)`, 'i').test(haystack);
  };

  const scored = [];
  for (const [id, kb] of Object.entries(TECH_STACK_KBS)) {
    let hits = 0;
    for (const kw of kb.keywords) {
      if (id === 'react' && kw === 'react' && /\breact\s+native\b/i.test(haystack) && !/\b(?:react\.js|reactjs|redux|next\.js|nextjs|jsx)\b/i.test(haystack)) {
        continue;
      }
      if (hasWord(kw)) hits += kw.includes(' ') || kw.length >= 4 ? 2 : 1;
    }
    if (hits > 0) scored.push({ kb, hits });
  }
  scored.sort((a, b) => b.hits - a.hits);

  const selected = scored.slice(0, maxCount).map((s) => s.kb);
  if (selected.length > 0) return selected;

  const fallbackIds = DEFAULT_TECH_STACK_MAP[archKey] || ['typescript', 'sql'];
  return fallbackIds.slice(0, maxCount).map((id) => TECH_STACK_KBS[id]).filter(Boolean);
}

export function formatTechStacksForInterviewer({ archKey = 'general', cvText = '', coreStack = [], jdText = '', topic = 'Technical', tier = 'medium', compact = false } = {}) {
  if (!['Technical', 'Live Coding', 'System Design'].includes(topic)) return '';
  const effTier = compact ? 'small' : tier;
  const maxCount = effTier === 'small' ? 1 : effTier === 'medium' ? 2 : 3;
  const stacks = detectRelevantTechStacks({ archKey, cvText, coreStack, jdText, maxCount });
  if (!stacks.length) return '';

  const lines = stacks.map((s) => {
    if (effTier === 'small') {
      const shortPit = s.pitfalls.split(',')[0];
      return `- ${s.label}: Trap: ${shortPit}. ${s.probe.slice(0, 120)}`;
    }
    if (effTier === 'medium') {
      return `- ${s.label}: Traps: ${s.pitfalls.slice(0, 130)} | Probe: ${s.probe.slice(0, 130)}`;
    }
    return `- **${s.label}**: Traps: ${s.pitfalls} Probe: ${s.probe}`;
  });
  return `STACK KB:\n${lines.join('\n')}`;
}
