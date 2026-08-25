# CI Android Build Caching (Bitrise)

Context for the caching setup introduced in CP-14966 (PR #4041), which cut `android-internal` builds from ~31.5 min to ~24 min. Read this before changing the cache steps in `bitrise.yml`, `android/gradle.properties`, or `scripts/bitrise/ensureAndroidTools.sh` — and when a CI build produces a result that looks haunted.

## What's in place

| Piece | Where | What it does |
| --- | --- | --- |
| `org.gradle.caching=true` | `android/gradle.properties` | Enables Gradle task-output caching — benefits local dev builds and same-build dedupe in CI (cross-build persistence deferred to CP-14974, see below) |
| `Restore/Save Gradle Cache` steps (pre-existing) | `bitrise.yml` | Persist dependencies only (jars, modules, wrapper, JDKs) |
| NPM cache fallback key | `bitrise.yml` `_install-and-set-env` | A `yarn.lock` change restores the previous cache and downloads only the delta |
| `ensureAndroidTools.sh` | `scripts/bitrise/` | Replaces the `install-missing-android-tools` step (3.5 min Gradle pass → ~4 s); self-heals NDK, SDK platform, and build-tools from the versions pinned in `android/build.gradle` |

## Cross-build task-output persistence: deferred to CP-14974

A `restore-cache`/`save-cache` pair persisting `~/.gradle/caches/build-cache-1` was built and measured on this branch, then **removed before merge**: warm builds reused 1,149 of 2,903 tasks yet moved wall-clock by ~0 min, because the critical path is the CMake/NDK C++ compile (skia, reanimated, quick-crypto, nitro modules), which Gradle's build cache cannot cache. The cached Kotlin/Java tasks were filling other cores in parallel, not the bottleneck. The pair only pays off once ccache shortens the C++ chain, so both ship together under **CP-14974**.

Hard-won facts recorded for that re-add:

- **Bitrise's `restore/save-gradle-cache` steps exclude `build-cache-1` by design** (verified in the step source — they persist dependencies only; task outputs are what the paid Bitrise Build Cache add-on covers). `org.gradle.caching=true` does nothing across CI builds without a separate save/restore-cache pair.
- **Use a static rolling prefix key** (`{{ .OS }}-{{ .Arch }}-gradle-build-cache-`), no checksum: the Gradle build cache is content-addressed, and version-code stamping rewrites `app/build.gradle` every build, which makes any checksum-of-gradle-files key unmatchable.
- **Never set `is_key_unique: true` on that save step.** It means "skip saving when this workflow restored the same key" — correct only for checksum-unique keys. With the static key it froze the archive at its first-ever save (proven on builds #9480/#9481: the warm build's save skipped in 1.37s and its new outputs were never persisted).
- **Concurrency is safe**: archives are immutable blobs and the key is a pointer; parallel builds restore whatever was latest, last writer wins the pointer, and a "losing" build's entries are regenerated and saved next round. Sharing one key across branches is deliberate — content addressing makes a PR branch safely reuse main's outputs.
- **Growth is self-limiting**: Gradle prunes `build-cache-1` entries unused for 7 days (gc timestamps live inside the cached dir, so cleanup carries across CI builds), and Bitrise expires unused archives.

## Trade-offs & what to do if something breaks

### Gradle build cache (`org.gradle.caching=true`)

- Pro: speeds up local dev builds and deduplicates identical tasks within a CI build. No cross-build persistence in CI until CP-14974.
- Risk: a task with misdeclared inputs (usually a third-party Gradle plugin) can serve a stale output — the symptom is a *weird build artifact*, not an error, which makes it easy to blame the wrong thing.
- If it goes wrong: locally, build once with `--no-build-cache` to confirm the cache is the culprit before digging elsewhere. In CI each build starts with an empty `build-cache-1`, so stale-output bugs cannot cross builds.

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

- The first build after any cache wipe is **slower** (seeding + a bigger save step). Judge changes from the second build onward.
- Full rollback = revert PR #4041. Partial: the build cache alone can be disabled by flipping `org.gradle.caching=false` without touching the rest.

## Known limits / next levers

The remaining ~16 min Gradle step is bounded by the CMake/NDK C++ compile. Next levers, in order: **CP-14974** (ccache for the C++ compile + re-adding the build-cache persistence pair per the notes above — they only pay off together), per-destination ABI trimming on E2E workflows (armeabi-v7a is dead weight there), machine-size bump. See CP-14966 comments for the measured data.
