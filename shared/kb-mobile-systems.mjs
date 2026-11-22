/**
 * Senior Domain Knowledge Bases: Go, Rust, Native iOS (Swift/Obj-C) & Cross-Platform Mobile
 * Roles: go, rust, ios, mobile
 */

export const KB_MOBILE_SYSTEMS = {
  go: {
    mandate: 'Build ultra-reliable, low-latency Go backend services with explicit concurrency cancellation, zero goroutine leaks, crisp error wrapping, and memory-conscious GC throughput.',
    mentalModels: [
      'Context-Driven Concurrency: Pass `context.Context` as first parameter everywhere; every spawned goroutine needs a guaranteed exit path when `ctx.Done()` fires (`errgroup.WithContext`).',
      'Shared State vs Channels Clarity: "Share memory by communicating", yet for simple counters/caches prefer `sync.Mutex` / `sync/atomic` over overengineered channel gymnastics.',
      'Data Race & Escape Analysis Discipline: Run `go test -race` in CI always; minimize heap escapes (`go build -gcflags=-m`) and preallocate slices when upper bounds are known.',
      'Graceful Server & DB Shutdown: Stop accepting new requests (`http.Server.Shutdown(ctx)`), drain in-flight workers, and enforce DB query/HTTP client timeouts (default `http.Client` has ZERO timeout!).'
    ],
    probeLadders: [
      { claim: 'We use http.Get and spawn goroutines with `go func()` for fan-out', probe: 'Expose two bugs immediately: zero client timeout hanging goroutines forever AND leaked goroutines/unbounded fan-out crashing memory without `errgroup.SetLimit`.' },
      { claim: 'Slices are passed efficiently', probe: 'Test hidden slice append aliasing where two sub-slices share backing arrays and silently corrupt adjacent elements.' },
      { claim: 'We catch concurrency bugs in unit tests', probe: 'Push on Go map concurrent read/write panics, closed-channel panics, and running `-race` detector under parallel load.' }
    ],
    redFlags: [
      'Using `http.DefaultClient` (no timeout!) or discarding `ctx` errors silently.',
      'Launching fire-and-forget goroutines inside HTTP handlers without tracking lifecycle or panic recovery.',
      'Swallowing `%w` error context or comparing string messages instead of `errors.Is` / `errors.As`.'
    ],
    roundRubrics: {
      HR: 'Validate production Go scale (gRPC, high-RPS microservices, CLI/cloud infra), Linux profiling experience, and pragmatic simplicity.',
      Behavioral: 'Probe tracking down a subtle goroutine/memory leak in production, simplifying overengineered abstractions, and incident ownership.',
      Technical: 'Drill goroutine lifecycle, channel deadlocks, `http.Client` timeouts, slice backing-array pitfalls, interface design ("accept interfaces, return structs"), and `pprof`.',
      'Live Coding': 'Write or trace a bounded concurrent worker pool (`errgroup` + `context` timeout + clean cancellation) avoiding race conditions.',
      'System Design': 'Architect a 50k RPS Go API gateway / worker pipeline with bounded backpressure, distributed rate limits, graceful drain, and OpenTelemetry.',
      Negotiation: 'Calibrate Senior/Staff Go Engineer band, platform/cloud premium, and equity expectations.'
    },
    powerPhrases: [
      'Before spawning a goroutine, I answer who cancels it and who waits for it—every concurrent fan-out gets a bounded `errgroup` and an explicit timeout context.',
      'Go’s `http.DefaultClient` ships with no timeout by default; enforcing transport dials, TLS handshake, and per-request context deadlines prevents silent tail-latency cascades.'
    ]
  },

  rust: {
    mandate: 'Engineer memory-safe, fearless concurrent systems where ownership models domain invariants at compile time and async executors never block on locks or heavy CPU work.',
    mentalModels: [
      'Compile-Time Invariants via Ownership & Types: Encode state machines in enums/typestates so invalid states cannot compile; keep lifetimes clean before reaching for `Arc<Mutex<T>>` everywhere.',
      'Async Executor Discipline (`tokio`): NEVER hold a `std::sync::MutexGuard` across `.await` points (deadlocks / `!Send` futures); offload synchronous CPU hashing/parsing via `tokio::task::spawn_blocking`.',
      'Zero-Copy & Allocation Control: Borrow `&[u8]`/`&str` in hot parsers, use `Bytes` for cheap refcounted network buffers, and inspect `#[inline]`/monomorphization binary bloat.',
      'Explicit Error Architecture: Use structured `thiserror` domain enums inside libraries and rich contextual chains (`anyhow`) at application edges—ban `.unwrap()` on untrusted input paths.'
    ],
    probeLadders: [
      { claim: 'We just wrap shared state in `Arc<Mutex<State>>` inside Tokio handlers', probe: 'Challenge lock contention across `.await` boundaries (`std::sync::Mutex` vs `tokio::sync::Mutex`), deadlock ordering, and lock-free/actor alternatives (`mpsc`).' },
      { claim: 'Rust eliminates all bugs at compile time', probe: 'Clarify what Rust does NOT prevent: deadlocks, memory leaks (`Rc` cycles), logic bugs, integer overflow in release builds (`wrapping`/`checked_*`), and FFI `unsafe` soundness bugs.' },
      { claim: 'Our async latency spikes intermittently', probe: 'Diagnose blocking sync file I/O, DNS resolution, or JSON CPU loops stalling Tokio worker threads instead of `spawn_blocking`.' }
    ],
    redFlags: [
      'Sprinkling `.unwrap()` / `.expect()` across network/user-input paths.',
      'Fighting the borrow checker blindly by `.clone()`-ing everything or inventing unsound `unsafe` shortcuts without writing `# Safety:` invariants.',
      'Confusing async cooperative concurrency (`tokio::select!`) cancellation safety.'
    ],
    roundRubrics: {
      HR: 'Validate production Rust background (backend APIs, infra, embedded, WASM, FFI bindings), C/C++ interop depth, and realistic ramp expectations.',
      Behavioral: 'Probe mentoring teams onto Rust cleanly without elitism, debugging subtle `tokio::select!` cancellation bugs, and balancing compile purity vs ship dates.',
      Technical: 'Drill ownership/lifetimes, `Send` vs `Sync`, `std::sync::Mutex` vs `tokio::sync::Mutex`, zero-copy serialization, `Drop` invariants, and `unsafe` FFI.',
      'Live Coding': 'Model a clean typestate / zero-copy parser or cancel-safe async worker queue cleanly using `Result`, `Option`, and idiomatic Rust iterators.',
      'System Design': 'Architect a ultra-low-latency Rust ingestion / storage engine or Wasm/native plugin host with deterministic backpressure and strict FFI sandboxing.',
      Negotiation: 'Calibrate Staff/Senior Systems Rust band, critical-infrastructure premium, and equity package.'
    },
    powerPhrases: [
      'If I ever need `unsafe`, it sits behind the smallest possible safe abstraction with explicit invariants documented and fuzzed—never scattered across business handlers.',
      'In Tokio, starving a worker thread with CPU work or holding a sync mutex across `.await` breaks cooperative scheduling just as badly as a classic thread deadlock.'
    ]
  },

  ios: {
    mandate: 'Deliver silky 120Hz ProMotion iOS experiences backed by rock-solid Swift concurrency, zero retain-cycle memory leaks, and seamless Swift + legacy Objective-C interop.',
    mentalModels: [
      'Swift Concurrency & Actor Isolation: Isolate UI mutations strictly on `@MainActor`; account for actor reentrancy across suspension points (`await`) so cached fetches don’t race twice.',
      'ARC & Objective-C Interop Safety: Master weak-strong capture in closures/Obj-C blocks, nullability audit annotations (`NS_ASSUME_NONNULL_BEGIN`), KVO lifecycle removal, and `@autoreleasepool` in tight image/asset loops.',
      'UIKit + SwiftUI Hybrid Mastery: Know SwiftUI `@Observable` identity stability vs `UIViewControllerRepresentable` for complex scroll/camera/WebKit surfaces.',
      'Apple Platform Hygiene: Keychain/Secure Enclave tokens, Universal Links + cold-start deep linking, Instruments Leaks/Time Profiler/Hangs, and App Store Connect crash-free monitoring.'
    ],
    probeLadders: [
      { claim: 'Adding `[weak self]` fixes all retain cycles in Swift and Objective-C', probe: 'Check nested timers/NotificationCenter observers/Combine `AnyCancellable` retention, and Obj-C block strong-self dance preventing mid-block deallocation surprises.' },
      { claim: 'We marked our network manager as an `actor` so it’s thread-safe', probe: 'Test actor reentrancy: two views concurrently call `await tokenManager.refresh()` -> without coalescing an in-flight `Task`, it still fires 2 refreshes!' },
      { claim: 'We still have old Objective-C modules alongside SwiftUI', probe: 'Probe bridging header hygiene, `@objc` dynamic dispatch vs Swift value types, and safe incremental migration without big-bang rewrites.' }
    ],
    redFlags: [
      'Force-unwrapping (`!`) JSON/Optional responses or storing JWTs in `UserDefaults` instead of Keychain.',
      'Doing synchronous image decoding, CoreData migrations, or disk I/O on the main thread causing watchdog kills (`0x8badf00d`).',
      'Zero profiling habits with Xcode Instruments or MetricKit.'
    ],
    roundRubrics: {
      HR: 'Assess native iOS App Store launches, SwiftUI vs UIKit ratio, Objective-C legacy maintenance comfort, and Apple HIG/privacy mastery.',
      Behavioral: 'Probe diagnosing a production Watchdog/OOM crash regression, migrating Objective-C code safely, and partnering closely with iOS Designers.',
      Technical: 'Drill ARC retain cycles, Swift 6 `Sendable`/actor reentrancy, Objective-C bridging & `@autoreleasepool`, CoreData/SwiftData concurrency, and Instruments.',
      'Live Coding': 'Trace an async token-refresh actor race, fix an Objective-C/Swift retain cycle + KVO crash, or design smooth paginated SwiftUI list state.',
      'System Design': 'Architect a modular multi-framework iOS app (Keychain Auth, Offline Sync, Universal Deep Links, Push Extensions, MetricKit observability & Fastlane CI).',
      Negotiation: 'Calibrate Staff/Senior iOS band, native Apple expertise value, and remote/equipment setup.'
    },
    powerPhrases: [
      'Swift actors eliminate data races on stored properties, NOT logical race conditions across an `await`—you still need in-flight `Task` coalescing for idempotent token refreshes.',
      'Mixing Objective-C and Swift safely means strict nullability annotations at bridging borders, `@autoreleasepool` for media loops, and zero `UserDefaults` credential shortcuts.'
    ]
  },

  mobile: {
    mandate: 'Ship native-feeling cross-platform mobile apps (React Native, Flutter, Cordova/Capacitor) by mastering JS/Dart-to-Native bridges, 120Hz rendering budgets, and offline/WebView traps.',
    mentalModels: [
      'Bridge & Thread Architecture Fluency: React Native New Architecture (JSI C++ synchronous calls + Fabric + Reanimated UI worklets), Flutter Isolates (`Isolate.run`), and Cordova/Capacitor WebView async plugin isolation.',
      'Render & Memory Discipline: Virtualize long feeds (`FlashList`/`ListView.builder`), downsample bitmaps before GPU upload (`cacheWidth`), and avoid layout-thrashing opacity/blur layers.',
      'WebView & Hybrid Security/Lifecycle (Cordova/Capacitor): Handle `WKWebView` OS background kills, `capacitor://` CORS/cookie boundaries, native SecureStorage vs evicted WebView localStorage.',
      'Release, Deep Link & Native Parity: Universal Links / App Links cold starts, native SDK MethodChannels/TurboModules (Apple Pay, Biometrics, BLE), OTA hotfix guardrails vs binary ABI safety.'
    ],
    probeLadders: [
      { claim: 'React Native works just like React web', probe: 'Expose native realities: JS thread vs UI Shadow thread saturation on gesture animations, Hermes bytecode startup, Android `BackHandler`/keyboard insets, and native ABI OTA mismatches.' },
      { claim: 'Our Cordova/Capacitor app stores offline tokens in localStorage', probe: 'Challenge iOS/Android storage eviction under low disk space and insecure WebView access—push toward encrypted native SQLite / Keychain plugin bridges.' },
      { claim: 'Scrolling stutters on older Android devices', probe: 'Diagnose heavy JSON deserialization on JS/UI thread, missing item view recycling, oversized uncached thumbnails, and animation worklets.' }
    ],
    redFlags: [
      'Treating mobile like desktop browser tabs—ignoring OS process termination, cellular offline drops, and cold-start push routing.',
      'Shipping OTA JavaScript bundles containing broken native bridge version calls crashing existing app store installs.',
      'Zero profiling with Flipper/React DevTools, Flutter DevTools, or Safari/Chrome WebView remote inspectors.'
    ],
    roundRubrics: {
      HR: 'Map balance across React Native, Flutter/Dart, Cordova/Capacitor, and underlying Swift/Kotlin native bridge comfort.',
      Behavioral: 'Probe migrating a legacy Cordova/RN Bridge app cleanly to Capacitor/New Architecture, surviving App Store rejection blockers, and resolving platform-specific bugs.',
      Technical: 'Drill JSI/Fabric vs Legacy Bridge, Reanimated worklets, Cordova `WKWebView` CORS/eviction & native plugin threading, Flutter Isolates, and offline sync.',
      'Live Coding': 'Debug a stuttery hybrid scroll feed + native bridge deadlock OR refactor an offline mutation queue with biometric/refresh-token locking.',
      'System Design': 'Architect a cross-platform mobile app sharing modular business logic safely across iOS/Android (Native Pay/Biometrics bridges, Offline SQLite, Crashlytics, Fastlane/EAS).',
      Negotiation: 'Calibrate Senior/Lead Cross-Platform Mobile band (highlighting dual iOS + Android + legacy Cordova migration leverage).'
    },
    powerPhrases: [
      'Cross-platform speed only lasts if you respect native OS boundaries—keep heavy parsing off the JS/UI thread, move persistence out of WebView localStorage into native SQLite/Keychain, and gate OTA updates against native binary versions.',
      'Whether migrating Cordova plugins to Capacitor or upgrading React Native to JSI/Fabric, predictable frame times come from minimizing async bridge chatter during gestures.'
    ]
  }
};
