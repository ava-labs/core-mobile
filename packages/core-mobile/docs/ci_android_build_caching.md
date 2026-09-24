# CI Build Caching (Bitrise)

Context for the caching setup on this repo. Two generations are relevant:

- **CP-14966 (PR #4041)** introduced key-based caching and the SDK guard script, cutting `android-internal` from ~31.5 min to ~24 min.
- **CP-14974** replaced the Gradle half of that with **Bitrise Build Cache for React Native**, which is what this document now mostly describes.

Read this before changing cache steps in `bitrise.yml`, `android/gradle.properties`, or `scripts/bitrise/ensureAndroidTools.sh` — and when a CI build produces a result that looks haunted.

## What's in place

| Piece | Where | What it does |
| --- | --- | --- |
| `activate-build-cache-for-react-native@1` | `bitrise.yml`, first step of every `_build-*` workflow | Bitrise Build Cache. Remote Gradle task cache + **ccache** for the C++ native modules (Android) and the Xcode compilation cache (iOS) |
| `org.gradle.caching=true` | `android/gradle.properties` | Required for the remote Gradle cache to be consulted at all. Do not turn this off |
| NPM cache fallback key | `bitrise.yml` `_install-and-set-env` | A `yarn.lock` change restores the previous cache and downloads only the delta |
| CocoaPods cache steps | `bitrise.yml` `_build-ios*` | Pods are **not** covered by Build Cache — these stay |
| `ensureAndroidTools.sh` | `scripts/bitrise/` | Replaces `install-missing-android-tools` (3.5 min Gradle pass → ~4 s); self-heals NDK, SDK platform, build-tools |

`restore-gradle-cache` / `save-gradle-cache` were **removed** — Build Cache supersedes them, and running both means paying a tarball round-trip for a cache the remote backend already serves per-task. The legacy `cache_level` input on `android-build` was also dropped; the current step no longer has that input.

## Measured results (CP-14974)

Measured on `android-internal-e2e` / `ios-internal-e2e`, medians of prior green builds as the baseline:

| Workflow | Baseline | Warm | Warm-run evidence |
| --- | --- | --- | --- |
| `android-internal-e2e` | 29.6 min | **12.6 min** | ccache 1359/1359 (100%), Gradle 1147/3163 (36.5%) |
| → Android Build step | 23.8 min | **9.3 min** | |
| `ios-internal-e2e` | 22.3 min | **13.5 min** | Xcode 4595/4597 (100%) |
| → iOS Simulator build step | 14.7 min | **6.7 min** | |
| `android-internal` (aab, release) | 20.7 min | **16.1 min** | ccache 925/925 (100%) |
| → Android Build step | 17.1 min | **11.5 min** | |
| `ios-internal` (archive, release) | 16.1 min | **12.9 min** | 0 cache misses |
| → Xcode Archive step | 10.7 min | **6.9 min** | |

The release paths hit a smaller ccache set (925 vs 1359) because they build 2 ABIs where E2E builds 3 — a subset, so E2E runs pre-warm them.

This confirms the CP-14966 diagnosis. Warm Gradle caching alone had reused ~1,149 tasks and moved wall-clock ~0 min because the critical path was the CMake/NDK C++ compile. The warm runs here reuse essentially the **same** 1,147 Gradle tasks, but paired with 100% ccache the clock collapses. **The C++ layer was the whole story.**

## Things that will confuse you (all verified the hard way)

- **Build Cache runs a one-off benchmark phase per build tool.** The progression is `baseline` (cache deliberately disabled, analytics only) → `warmup` (cache on, populating) → warm. The first build after adoption is *supposed* to show zero cache activity. Judge from the third run, never the first.
- **Each build tool tracks its phase separately.** Flipping `gradle_cache_enabled` on iOS restarted that tool's baseline while Xcode was already warm.
- **The cache is keyed by region x workflow namespace, and does not span regions.** Bitrise runs three datacenters — AMS1 (EU), IAD1 and ORD1 (US) — and this workspace uses the **Global** distribution mode, so builds land wherever there is capacity. A build landing in a region that has not run *that workflow* before sees ~0% and re-uploads everything. With 3 datacenters x 4 workflow variants that is up to **12 combinations**, each needing one cold build. **The cost is one-time per combination, not recurring** — proven: IAD1 was cold on its first `android-internal-e2e` build (#9517, ccache 3.5%) and hit 100% on its second (#9521). If a build is inexplicably slow, check `BITRISE_DEN_VM_DATACENTER` before assuming a regression.
- **Region can be pinned, and probably should be.** Bitrise offers EU-only / US-only / Global modes. **EU-only** would cut those 12 combinations to 4 and put every build on the fastest hardware (AMS1 runs Zen5 and M4/M4 Pro; ORD1 runs Zen4 and M2 Pro). US-only helps far less — the US is two datacenters. The setting is **not** exposed in the Bitrise v0.1 API (app, organization, settings and machine-types endpoints have no region field) and appears to be UI or support provisioned. Unknown, and worth confirming with Bitrise: whether cache entries have a TTL, since a rarely-used combination aging out would turn the one-time cost into a recurring one.
- **Machine class varies with region too** (zen5 vs zen4, M4 vs M2 Pro), so wall-clock comparisons across regions are confounded. Compare the cache hit counters, which are not.
- **Every workflow variant is its own cache namespace.** `_build-android` (aab, 2 ABIs) and `_build-android-internal-for-testing` (apk, 3 ABIs) do not share ccache entries. Each needs its own warm-up.
- **`gradle_cache_enabled` also gates ccache**, including on iOS where there is no Gradle. Setting it `false` on the iOS workflows silently disabled C++ caching — the symptom was `Failed to create storage helper for ccache stats collection`.
- **The "Version code has changed!" warning is a red herring here.** It is a generic heuristic. Measured: builds with *different* version codes and a build with the version injected as a Gradle property all produced an identical 1147 / 36.52% / 55.8%. Version-code churn is not what caps the Gradle hit rate. See CP-15085, which is open to find what actually does.

## Trade-offs & what to do if something breaks

### Remote build cache (Build Cache + `org.gradle.caching=true`)

- Pro: reuses task outputs and compiled objects across builds and machines. This is where the ~2x comes from.
- **Risk, and it changed with CP-14974:** a task with misdeclared inputs (usually a third-party Gradle plugin) can serve a stale output. The symptom is a *weird build artifact*, not an error, which makes it easy to blame the wrong thing. Previously each CI build started with an empty local `build-cache-1`, so such a bug could not cross builds. **That is no longer true** — the cache is remote and shared across builds, branches and machines, so a poisoned entry can now persist and spread. This is the main correctness cost of the change.
- If it goes wrong: locally, build once with `--no-build-cache` to confirm the cache is the culprit before digging elsewhere. In CI, set the activation step's *push new cache entries* input to `false` for read-only mode, or remove the step entirely to fall back to uncached builds. Both are one-line changes.

### NPM cache fallback key

- Pro: lockfile changes no longer trigger a fully cold install.
- Risk: minimal — `yarn install --immutable` validates against the lockfile, so a stale restore costs download time, not correctness.
- If it goes wrong: delete the `npm-cache-*` entries in Bitrise cache management; the next build re-seeds.

### `ensureAndroidTools.sh`

- Pro: self-healing is proven, not theoretical — build-tools 36.0.0 was genuinely missing from the stack image and the script installed it on the fly.
- Risk: coverage is narrower than the old step. It self-heals only the NDK, SDK platform, and build-tools versions pinned in `android/build.gradle`. Any *other* newly required SDK component (a cmdline-tools bump, system images, etc.) will hard-fail the Gradle step with a "missing component" error instead of silently installing.
- If it goes wrong: add the component to the script (check dir → `sdkmanager "<component>"`), same pattern as the existing three. If the `compileSdkVersion`/`buildToolsVersion` declaration format in `build.gradle` ever changes, the script fails loudly with an explicit parse error — update its grep pattern.
- Shell gotcha, do not "simplify" it back: installs run with stdin closed (`< /dev/null`) and licenses pre-accepted instead of the usual `yes | sdkmanager` idiom. Under `set -o pipefail`, `yes` dies with SIGPIPE (exit 141) when `sdkmanager` exits first, failing the build *after a successful install* (this happened on build #9476).

### General

- The first build after any cache wipe, region change, or workflow-variant change is **slower** (seeding). Judge changes from the third run onward — see the benchmark-phase note above.
- Storage: single archive cap 15 GB, 100 GB allowance, LRU eviction past that. Over-running the quota degrades hit rate; it does not fail builds.
- Full rollback = remove the `activate-build-cache-for-react-native@1` steps. Partial = set *push new cache entries* to `false` for read-only. Neither requires touching `gradle.properties`.

## Known limits / next levers

The C++ bottleneck is addressed — ccache holds 100% on warm runs. With compilation largely cached, the remaining time is dependency installation, which Build Cache does not cover:

- **Android** (~12.6 min warm): Yarn Setup ~2.6 min
- **iOS** (~13.5 min warm): Yarn Setup ~2.4 min + CocoaPods install ~2.6 min — about **37%** of the build

Next levers, in order: dependency-install caching, **CP-15085** (why Gradle sits at 36.5%), per-destination ABI trimming on E2E workflows (armeabi-v7a is dead weight there), machine-size bump. See CP-14966 and CP-14974 comments for the measured data.
