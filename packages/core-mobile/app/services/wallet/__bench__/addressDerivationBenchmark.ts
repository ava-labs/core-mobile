/**
 * Address derivation benchmark (dev-only).
 *
 * For each value of N in `accountCounts`, compares three scenarios that all
 * derive addresses for the first N account indices:
 *
 *   A  ModuleManager.deriveAddresses                           (legacy JS path)
 *   B  WalletService.getPublicKeyFor x4 + 4 new native APIs    (full new path)
 *   C  Pre-fetched pubkeys + 4 new native APIs                 (native-only)
 *
 * Fairness: before any timed run, we pre-fetch all pubkeys via
 * `WalletService.getPublicKeyFor` for every account index across every
 * curve/path. That populates `WalletFactory.cache`, which the JS modules
 * inside scenario A reach via `ApprovalController.requestPublicKey →
 * WalletService.getPublicKeyFor`. So A, B, and C all start with a warm
 * pubkey cache. Per-N warmup runs further amortize any module-internal
 * one-time work.
 *
 * Tied to the active signed-in wallet. Skips Ledger / Keystone / Seedless
 * wallets since scenario A would block on the device, and the new APIs only
 * speed up the pubkey-already-on-hand path.
 *
 * Output: console.log a structured JSON blob — full per-N stats plus a
 * per-account-normalized matrix you can paste into the brain. Trigger
 * button also shows a one-line-per-N summary in an alert.
 *
 * Delete or gate before merge — this is for CP-14062 benchmarking only.
 */

import { NetworkVMType } from '@avalabs/vm-module-types'
import {
  deriveAddressesForAvalanche,
  deriveAddressesForBtc,
  deriveAddressesForEvm,
  deriveAddressesForSvm
} from 'react-native-nitro-avalabs-crypto'
import ModuleManager from 'vmModule/ModuleManager'
import { Network } from '@avalabs/core-chains-sdk'
import { WalletType } from 'services/wallet/types'
import { Curve } from 'utils/publicKeys'
import WalletService from '../WalletService'
import { getAddressDerivationPath } from '../utils'

// -------------------------------------------------------------------------
// Config
// -------------------------------------------------------------------------

export interface BenchmarkConfig {
  walletId: string
  walletType: WalletType
  accountCounts: number[] // sweep values, e.g. [1, 5, 10, 20, 50, 100]
  isTestnet: boolean
  // Set both to null to use the adaptive heuristic (more samples at small N,
  // fewer at large N). Otherwise applies the constant to every N.
  repeats: number | null
  warmupRepeats: number | null
}

export const DEFAULT_BENCHMARK_CONFIG: Omit<
  BenchmarkConfig,
  'walletId' | 'walletType'
> = {
  accountCounts: [1, 5, 10, 20, 50, 100],
  isTestnet: false,
  repeats: null,
  warmupRepeats: null
}

// Heuristic: more samples when each run is fast, fewer when each is slow.
// Scenario A dominates wall time; at N=100 a single A iteration can be
// multiple seconds, so we cap repeats hard there. Clamp to [3, 50].
function repeatsFor(n: number, explicit: number | null): number {
  if (explicit !== null) return Math.max(1, explicit)
  return Math.max(3, Math.min(50, Math.floor(200 / Math.max(1, n))))
}

function warmupRepeatsFor(n: number, explicit: number | null): number {
  if (explicit !== null) return Math.max(0, explicit)
  // One quarter of timed reps, min 1, max 5.
  return Math.max(1, Math.min(5, Math.floor(repeatsFor(n, null) / 4)))
}

// -------------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------------

interface ScenarioStats {
  scenario: 'A' | 'B' | 'C' | 'E'
  label: string
  runs: number
  totalMs: number
  meanMs: number
  minMs: number
  medianMs: number
  p95Ms: number
  maxMs: number
  // Per-account normalization: medianMs / N. Lets you compare across N
  // values at a glance.
  medianMsPerAccount: number
}

function summarize({
  scenario,
  label,
  samples,
  accountsPerRun
}: {
  scenario: ScenarioStats['scenario']
  label: string
  samples: number[]
  accountsPerRun: number
}): ScenarioStats {
  const sorted = [...samples].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const p = (q: number): number => {
    if (sorted.length === 0) return 0
    const idx = Math.min(
      sorted.length - 1,
      Math.max(0, Math.floor(q * (sorted.length - 1)))
    )
    return sorted[idx] ?? 0
  }
  const median = p(0.5)
  return {
    scenario,
    label,
    runs: sorted.length,
    totalMs: sum,
    meanMs: sorted.length === 0 ? 0 : sum / sorted.length,
    minMs: sorted[0] ?? 0,
    medianMs: median,
    p95Ms: p(0.95),
    maxMs: sorted[sorted.length - 1] ?? 0,
    medianMsPerAccount: accountsPerRun === 0 ? 0 : median / accountsPerRun
  }
}

// -------------------------------------------------------------------------
// Hex → ArrayBuffer (getPublicKeyFor returns hex string without 0x)
// -------------------------------------------------------------------------

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const h = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex
  if (h.length % 2 !== 0) {
    throw new Error(`hex string length must be even: ${h.length}`)
  }
  const out = new Uint8Array(h.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return out.buffer
}

// -------------------------------------------------------------------------
// Per-account pubkey set used by scenarios B and C
// -------------------------------------------------------------------------

interface PubKeySet {
  accountIndex: number
  evm: ArrayBuffer
  avax: ArrayBuffer
  svm: ArrayBuffer
}

interface FetchPubKeySetParams {
  walletId: string
  walletType: WalletType
  accountIndex: number
  derivationPathType: 'bip44' | 'ledger_live' | undefined
}

// Aggregate per-phase timings across all fetchPubKeySet invocations.
// Flip via the "fetch-phase timings" block at the end of runForN — we reset
// before each scenario and dump after, so the numbers reflect what that
// scenario actually paid. Cost of accumulating is microseconds; safe to leave
// on permanently while iterating on the benchmark.
const fetchTimings = {
  paths: 0, // sum of synchronous getAddressDerivationPath x3 wall time
  pubkeys: 0, // sum of Promise.all WalletService.getPublicKeyFor x3 wall time
  hex: 0, // sum of hexToArrayBuffer x3 wall time
  calls: 0 // how many fetchPubKeySet invocations were measured
}

function resetFetchTimings(): void {
  fetchTimings.paths = 0
  fetchTimings.pubkeys = 0
  fetchTimings.hex = 0
  fetchTimings.calls = 0
}

function logFetchTimings(label: string): void {
  if (fetchTimings.calls === 0) return
  const n = fetchTimings.calls
  // eslint-disable-next-line no-console
  console.log(
    `[fetchPubKeySet timings — ${label}] calls=${n}  ` +
      `paths total=${fetchTimings.paths.toFixed(2)}ms avg=${(
        fetchTimings.paths / n
      ).toFixed(3)}ms  ` +
      `pubkeys total=${fetchTimings.pubkeys.toFixed(2)}ms avg=${(
        fetchTimings.pubkeys / n
      ).toFixed(3)}ms  ` +
      `hex total=${fetchTimings.hex.toFixed(2)}ms avg=${(
        fetchTimings.hex / n
      ).toFixed(3)}ms`
  )
}

async function fetchPubKeySet({
  walletId,
  walletType,
  accountIndex,
  derivationPathType
}: FetchPubKeySetParams): Promise<PubKeySet> {
  // Phase 1: derivation-path construction (synchronous JS).
  const t0 = now()
  const evmPath = getAddressDerivationPath({
    accountIndex,
    vmType: NetworkVMType.EVM,
    derivationPathType
  })
  const avaxPath = getAddressDerivationPath({
    accountIndex,
    vmType: NetworkVMType.AVM,
    derivationPathType
  })
  const svmPath = getAddressDerivationPath({
    accountIndex,
    vmType: NetworkVMType.SVM,
    derivationPathType
  })
  const t1 = now()

  // Phase 2: pubkey lookup (3 concurrent WalletService calls, hits
  // WalletFactory.cache after the initial prefetch).
  const [evmHex, avaxHex, svmHex] = await Promise.all([
    WalletService.getPublicKeyFor({
      walletId,
      walletType,
      derivationPath: evmPath,
      curve: Curve.SECP256K1
    }),
    WalletService.getPublicKeyFor({
      walletId,
      walletType,
      derivationPath: avaxPath,
      curve: Curve.SECP256K1
    }),
    WalletService.getPublicKeyFor({
      walletId,
      walletType,
      derivationPath: svmPath,
      curve: Curve.ED25519
    })
  ])
  const t2 = now()

  // Phase 3: hex → ArrayBuffer (3x).
  const result: PubKeySet = {
    accountIndex,
    evm: hexToArrayBuffer(evmHex),
    avax: hexToArrayBuffer(avaxHex),
    svm: hexToArrayBuffer(svmHex)
  }
  const t3 = now()

  fetchTimings.paths += t1 - t0
  fetchTimings.pubkeys += t2 - t1
  fetchTimings.hex += t3 - t2
  fetchTimings.calls += 1

  return result
}

// -------------------------------------------------------------------------
// Scenarios — each takes a slice of account indices and runs end-to-end
// once. Repeated by the timing driver.
// -------------------------------------------------------------------------

interface ScenarioInputs {
  walletId: string
  walletType: WalletType
  derivationPathType: 'bip44' | 'ledger_live' | undefined
  isTestnet: boolean
  accountIndices: number[]
  pubKeys: PubKeySet[] // aligned with accountIndices
}

async function runScenarioA(inputs: ScenarioInputs): Promise<void> {
  // Pubkey cache is already warm (top-level pre-fetch).
  // ModuleManager.deriveAddresses requires only the isTestnet flag on Network.
  const network = { isTestnet: inputs.isTestnet } as Network
  for (const accountIndex of inputs.accountIndices) {
    await ModuleManager.deriveAddresses({
      walletId: inputs.walletId,
      walletType: inputs.walletType,
      accountIndex,
      network
    })
  }
}

async function runScenarioB(inputs: ScenarioInputs): Promise<void> {
  // getPublicKeyFor calls will hit WalletFactory.cache (warm from pre-fetch),
  // so this measures cache-hit + native-encode cost — the realistic best
  // case for callers that already paid the pubkey lookup once.
  for (const accountIndex of inputs.accountIndices) {
    const pks = await fetchPubKeySet({
      walletId: inputs.walletId,
      walletType: inputs.walletType,
      accountIndex,
      derivationPathType: inputs.derivationPathType
    })
    deriveAddressesForEvm([pks.evm])
    deriveAddressesForBtc([pks.evm], inputs.isTestnet)
    deriveAddressesForAvalanche([pks.avax], [pks.evm], inputs.isTestnet)
    deriveAddressesForSvm([pks.svm])
  }
}

function runScenarioC(inputs: ScenarioInputs): void {
  for (const pks of inputs.pubKeys) {
    deriveAddressesForEvm([pks.evm])
    deriveAddressesForBtc([pks.evm], inputs.isTestnet)
    deriveAddressesForAvalanche([pks.avax], [pks.evm], inputs.isTestnet)
    deriveAddressesForSvm([pks.svm])
  }
}

// Scenario E: identical body to scenario A — `ModuleManager.deriveAddresses`
// per accountIndex. The bench's runForN explicitly pre-warms the
// utils.ts::getAddressDerivationPath cache before E's timed runs so this
// diagnostic answers a single question:
//
//   Do the JS VM modules (`module.deriveAddress`) reach into our memoized
//   `getAddressDerivationPath` helper, or do they call their own
//   `buildDerivationPath` directly?
//
//   E ≈ A → modules bypass our memo (cache patch helps nothing in production
//           for legacy callers).
//   E < A → modules use the memo and the cache patch already speeds them up.
async function runScenarioE(inputs: ScenarioInputs): Promise<void> {
  // Delegates to scenario A's body — the difference between E and A is set
  // up *outside* the timed loop (runForN explicitly pre-warms the path
  // cache before E's runs). Keeping this as a wrapper so the scenarios
  // table reads symmetrically.
  await runScenarioA(inputs)
}

// Walk every (accountIndex, vmType) combination the JS modules might
// touch through `getAddressDerivationPath`. Populates the utils.ts memo so
// any subsequent caller that goes through the helper hits the cache.
function prewarmPathCacheForN(
  accountIndices: number[],
  derivationPathType: 'bip44' | 'ledger_live' | undefined
): void {
  // Mirror the vmTypes each VM module touches when deriving its address set.
  // PVM/HVM are excluded by the helper's type signature.
  const vmTypes: Array<
    Exclude<NetworkVMType, NetworkVMType.PVM | NetworkVMType.HVM>
  > = [
    NetworkVMType.EVM,
    NetworkVMType.BITCOIN,
    NetworkVMType.AVM,
    NetworkVMType.CoreEth,
    NetworkVMType.SVM
  ]
  for (const accountIndex of accountIndices) {
    for (const vmType of vmTypes) {
      getAddressDerivationPath({ accountIndex, vmType, derivationPathType })
    }
  }
}

// -------------------------------------------------------------------------
// Driver
// -------------------------------------------------------------------------

export interface PerNResult {
  accountCount: number
  repeats: number
  warmupRepeats: number
  scenarios: ScenarioStats[]
  deltas: {
    bVsA: string
    cVsA: string
    cVsB: string
    eVsA: string // scenario E = A with path cache pre-warmed
  }
}

export interface BenchmarkResult {
  config: BenchmarkConfig
  pubkeyPrefetchMs: number
  perN: PerNResult[]
  // Compact summary row per N — handy for pasting into the brain.
  matrix: Array<{
    n: number
    aMedianMs: number
    bMedianMs: number
    cMedianMs: number
    eMedianMs: number
    aPerAccountMs: number
    bPerAccountMs: number
    cPerAccountMs: number
    ePerAccountMs: number
    bVsA: number
    cVsA: number
    eVsA: number
  }>
  startedAt: string
  finishedAt: string
}

const now = (): number => globalThis.performance?.now?.() ?? Date.now()

async function timedRuns(
  fn: () => Promise<void> | void,
  total: number
): Promise<number[]> {
  const samples: number[] = []
  for (let i = 0; i < total; i++) {
    const t0 = now()
    await fn()
    samples.push(now() - t0)
  }
  return samples
}

// Per-N driver — extracted so the outer loop stays simple.
async function runForN({
  n,
  cfg,
  derivationPathType,
  allPubKeys
}: {
  n: number
  cfg: BenchmarkConfig
  derivationPathType: 'bip44' | 'ledger_live' | undefined
  allPubKeys: PubKeySet[]
}): Promise<{
  perNEntry: PerNResult
  matrixEntry: BenchmarkResult['matrix'][number]
}> {
  const accountIndices = Array.from({ length: n }, (_, i) => i)
  const pubKeys = allPubKeys.slice(0, n)
  const inputs: ScenarioInputs = {
    walletId: cfg.walletId,
    walletType: cfg.walletType,
    derivationPathType,
    isTestnet: cfg.isTestnet,
    accountIndices,
    pubKeys
  }
  const reps = repeatsFor(n, cfg.repeats)
  const warm = warmupRepeatsFor(n, cfg.warmupRepeats)

  // Warm-up (discarded) — primes any per-N module-internal caches.
  await timedRuns(() => runScenarioA(inputs), warm)
  await timedRuns(() => runScenarioB(inputs), warm)
  await timedRuns(() => runScenarioC(inputs), warm)

  // Timed
  const aSamples = await timedRuns(() => runScenarioA(inputs), reps)
  // Reset fetch-phase aggregator just before scenario B's timed runs so the
  // dumped breakdown reflects only this N's measured calls (not warmup, not
  // the top-level prefetch, not the other scenarios).
  resetFetchTimings()
  const bSamples = await timedRuns(() => runScenarioB(inputs), reps)
  logFetchTimings(`N=${n} scenario B`)
  const cSamples = await timedRuns(() => runScenarioC(inputs), reps)

  // Scenario E — explicitly pre-warm the path cache for every
  // (accountIndex, vmType) the modules might touch, then run scenario A's
  // body. If the modules go through utils.ts::getAddressDerivationPath,
  // they'll hit the populated cache and E will be measurably faster than
  // A. If they call their own buildDerivationPath directly, E ≈ A.
  prewarmPathCacheForN(accountIndices, derivationPathType)
  const eSamples = await timedRuns(() => runScenarioE(inputs), reps)

  const a = summarize({
    scenario: 'A',
    label: 'ModuleManager.deriveAddresses',
    samples: aSamples,
    accountsPerRun: n
  })
  const b = summarize({
    scenario: 'B',
    label: 'getPublicKeyFor x4 + 4 native APIs',
    samples: bSamples,
    accountsPerRun: n
  })
  const c = summarize({
    scenario: 'C',
    label: 'pre-fetched pubkeys + 4 native APIs',
    samples: cSamples,
    accountsPerRun: n
  })
  const e = summarize({
    scenario: 'E',
    label: 'ModuleManager.deriveAddresses (path cache pre-warmed)',
    samples: eSamples,
    accountsPerRun: n
  })

  const ratio = (x: number, y: number): string =>
    y === 0 ? 'n/a' : `${(x / y).toFixed(2)}x`
  const ratioNum = (x: number, y: number): number =>
    y === 0 ? 0 : Number((x / y).toFixed(2))

  const perNEntry: PerNResult = {
    accountCount: n,
    repeats: reps,
    warmupRepeats: warm,
    scenarios: [a, b, c, e],
    deltas: {
      bVsA: `B vs A: ${ratio(a.medianMs, b.medianMs)} faster (median)`,
      cVsA: `C vs A: ${ratio(a.medianMs, c.medianMs)} faster (median)`,
      cVsB: `C vs B: ${ratio(b.medianMs, c.medianMs)} faster (median)`,
      eVsA: `E vs A: ${ratio(a.medianMs, e.medianMs)} faster (median)`
    }
  }

  const matrixEntry: BenchmarkResult['matrix'][number] = {
    n,
    aMedianMs: Number(a.medianMs.toFixed(2)),
    bMedianMs: Number(b.medianMs.toFixed(2)),
    cMedianMs: Number(c.medianMs.toFixed(2)),
    eMedianMs: Number(e.medianMs.toFixed(2)),
    aPerAccountMs: Number(a.medianMsPerAccount.toFixed(3)),
    bPerAccountMs: Number(b.medianMsPerAccount.toFixed(3)),
    cPerAccountMs: Number(c.medianMsPerAccount.toFixed(3)),
    ePerAccountMs: Number(e.medianMsPerAccount.toFixed(3)),
    bVsA: ratioNum(a.medianMs, b.medianMs),
    cVsA: ratioNum(a.medianMs, c.medianMs),
    eVsA: ratioNum(a.medianMs, e.medianMs)
  }

  return { perNEntry, matrixEntry }
}

export async function runAddressDerivationBenchmark(
  partial: Partial<BenchmarkConfig> & {
    walletId: string
    walletType: WalletType
  }
): Promise<BenchmarkResult> {
  const cfg: BenchmarkConfig = {
    ...DEFAULT_BENCHMARK_CONFIG,
    ...partial
  }
  const startedAt = new Date().toISOString()

  // Match WalletService's derivation-path-type choice (only matters for
  // hardware wallets — we skip those before reaching here).
  const derivationPathType =
    cfg.walletType === WalletType.MNEMONIC
      ? undefined
      : cfg.walletType === WalletType.LEDGER
      ? 'bip44'
      : 'ledger_live'

  // Ensure modules are initialized so scenario A's first call isn't paying
  // ModuleManager.init() cost. (It also runs in the constructor, but this
  // is an explicit guarantee.)
  await ModuleManager.init()

  // Pre-fetch pubkeys for the largest N once. This populates
  // WalletFactory.cache, which scenario A's modules reach via
  // ApprovalController.requestPublicKey → WalletService.getPublicKeyFor.
  // So scenario A, B, and C all start with a fully warm pubkey cache —
  // any difference between them is the encoding/module work alone.
  const maxN = cfg.accountCounts.reduce((m, n) => Math.max(m, n), 0)
  resetFetchTimings()
  const prefetchT0 = now()
  const allPubKeys: PubKeySet[] = []
  for (let accountIndex = 0; accountIndex < maxN; accountIndex++) {
    allPubKeys.push(
      await fetchPubKeySet({
        walletId: cfg.walletId,
        walletType: cfg.walletType,
        accountIndex,
        derivationPathType
      })
    )
  }
  const pubkeyPrefetchMs = now() - prefetchT0
  logFetchTimings('top-level prefetch (cold cache)')

  // Sweep over account counts
  const perN: PerNResult[] = []
  const matrix: BenchmarkResult['matrix'] = []

  for (const n of cfg.accountCounts) {
    if (n <= 0) continue
    const { perNEntry, matrixEntry } = await runForN({
      n,
      cfg,
      derivationPathType,
      allPubKeys
    })
    perN.push(perNEntry)
    matrix.push(matrixEntry)
  }

  const result: BenchmarkResult = {
    config: cfg,
    pubkeyPrefetchMs,
    perN,
    matrix,
    startedAt,
    finishedAt: new Date().toISOString()
  }

  // eslint-disable-next-line no-console
  console.log('[addressDerivationBenchmark]', JSON.stringify(result, null, 2))

  return result
}
