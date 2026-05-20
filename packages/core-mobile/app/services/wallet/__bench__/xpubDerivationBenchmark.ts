/**
 * Xpub-based address derivation benchmark (dev-only).
 *
 * For each N in `accountCounts`, compares two ways of deriving the secp256k1
 * chain address set for the first N account indices, in both cache states:
 *
 *   A_cold  native deriveAddressesFromXpubs (batched)   — first timed sample
 *   A_warm  native deriveAddressesFromXpubs (batched)   — median of remaining
 *   B_cold  JS     deriveAddressesFromXpub  (looped)    — first timed sample
 *   B_warm  JS     deriveAddressesFromXpub  (looped)    — median of remaining
 *
 * "Cold" here is JIT/first-call cost — both functions are stateless wrt the
 * wallet (no pubkey/xpub cache to clear), so the first sample of each per-N
 * scenario captures one-time costs (V8 inline-cache miss, native bridge
 * warmup, bip32 fromBase58 first-parse) and subsequent samples form the
 * steady-state warm distribution.
 *
 * A is the `react-native-nitro-avalabs-crypto` export; B is the JS path used
 * by `deriveAddressesBatch` (in `services/ledger/deriveAddressesOffline.ts`)
 * when the native call throws.
 *
 * Inputs are derived from a fixed test mnemonic so the benchmark doesn't need
 * the user's seed — we're measuring pure derivation cost, not wallet I/O.
 *
 * Output: console.log a structured JSON blob + an Alert table.
 *
 * Delete or gate before merge — for CP-14062 follow-up benchmarking only.
 */

import { mnemonicToSeedSync } from 'bip39'
import { deriveAddressesFromXpubs as nativeDeriveAddressesFromXpubs } from 'react-native-nitro-avalabs-crypto'
import { bip32 } from 'utils/bip32'
import { deriveAddressesFromXpub } from 'services/ledger/deriveAddressesOffline'

// -------------------------------------------------------------------------
// Config
// -------------------------------------------------------------------------

export interface XpubBenchmarkConfig {
  accountCounts: number[]
  isTestnet: boolean
  repeats: number | null
}

export const DEFAULT_XPUB_BENCHMARK_CONFIG: XpubBenchmarkConfig = {
  accountCounts: [1, 5, 10, 20, 50, 100],
  isTestnet: false,
  repeats: null
}

// Shared test mnemonic — generates valid xpubs without touching the user's
// wallet. Address values aren't checked; we only measure timing.
const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

function repeatsFor(n: number, explicit: number | null): number {
  if (explicit !== null) return Math.max(2, explicit)
  // JS scenario scales linearly; cap to keep wall time reasonable at large N.
  // Floor at 2 so we always have a cold sample plus at least one warm sample.
  return Math.max(2, Math.min(30, Math.floor(150 / Math.max(1, n))))
}

// -------------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------------

type ScenarioKey = 'A' | 'B'

interface ScenarioStats {
  scenario: ScenarioKey
  label: string
  runs: number
  totalMs: number
  meanMs: number
  minMs: number
  medianMs: number
  p95Ms: number
  maxMs: number
  medianMsPerAccount: number
}

function summarize({
  scenario,
  label,
  samples,
  accountsPerRun
}: {
  scenario: ScenarioKey
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
// Xpub generation
// -------------------------------------------------------------------------

interface XpubSet {
  evmXpub: string
  avalancheXpubs: string[]
  accountIndices: number[]
}

function buildXpubsForN(n: number): XpubSet {
  const seed = mnemonicToSeedSync(TEST_MNEMONIC)
  const master = bip32.fromSeed(seed)

  // EVM xpub is shared across accounts: m/44'/60'/0'
  const evmXpub = master.derivePath("m/44'/60'/0'").neutered().toBase58()

  // Avalanche xpubs are per-account: m/44'/9000'/{i}'
  const avalancheXpubs: string[] = []
  const accountIndices: number[] = []
  for (let i = 0; i < n; i++) {
    avalancheXpubs.push(
      master.derivePath(`m/44'/9000'/${i}'`).neutered().toBase58()
    )
    accountIndices.push(i)
  }

  return { evmXpub, avalancheXpubs, accountIndices }
}

// -------------------------------------------------------------------------
// Scenarios
// -------------------------------------------------------------------------

interface ScenarioInputs {
  evmXpub: string
  avalancheXpubs: string[]
  accountIndices: number[]
  isTestnet: boolean
}

// A — native batched call. Runs on a background thread.
async function runScenarioA(inputs: ScenarioInputs): Promise<void> {
  await nativeDeriveAddressesFromXpubs(
    inputs.evmXpub,
    inputs.avalancheXpubs,
    inputs.isTestnet,
    inputs.accountIndices
  )
}

// B — JS loop. Mirrors the fallback path inside deriveAddressesBatch.
function runScenarioB(inputs: ScenarioInputs): void {
  for (let i = 0; i < inputs.accountIndices.length; i++) {
    const accountIndex = inputs.accountIndices[i]
    const avalancheXpub = inputs.avalancheXpubs[i]
    if (accountIndex === undefined || avalancheXpub === undefined) continue
    deriveAddressesFromXpub(
      inputs.evmXpub,
      avalancheXpub,
      inputs.isTestnet,
      accountIndex
    )
  }
}

// -------------------------------------------------------------------------
// Driver
// -------------------------------------------------------------------------

export interface PerNResult {
  accountCount: number
  repeats: number
  // First (cold) sample per scenario, isolated from the median.
  aColdMs: number
  bColdMs: number
  // Stats over the remaining (warm) samples — samples[1..reps-1].
  scenarios: ScenarioStats[]
  deltas: {
    bVsAWarm: string
    bVsACold: string
    aColdVsWarm: string
    bColdVsWarm: string
  }
}

export interface XpubBenchmarkResult {
  config: XpubBenchmarkConfig
  xpubGenMs: number
  perN: PerNResult[]
  matrix: Array<{
    n: number
    aColdMs: number
    aWarmMs: number
    bColdMs: number
    bWarmMs: number
    aColdPerAccountMs: number
    aWarmPerAccountMs: number
    bColdPerAccountMs: number
    bWarmPerAccountMs: number
    bVsAWarm: number
    bVsACold: number
    aColdVsWarm: number
    bColdVsWarm: number
  }>
  startedAt: string
  finishedAt: string
}

const now = (): number => globalThis.performance?.now?.() ?? Date.now()

async function timedAsync(fn: () => Promise<void>): Promise<number> {
  const t0 = now()
  await fn()
  return now() - t0
}

function timedSync(fn: () => void): number {
  const t0 = now()
  fn()
  return now() - t0
}

async function runForN({
  n,
  cfg,
  inputs
}: {
  n: number
  cfg: XpubBenchmarkConfig
  inputs: ScenarioInputs
}): Promise<{
  perNEntry: PerNResult
  matrixEntry: XpubBenchmarkResult['matrix'][number]
}> {
  const reps = repeatsFor(n, cfg.repeats)

  // No warmup — the very first sample of each scenario is the cold run.
  // Subsequent samples form the warm distribution.
  const aSamples: number[] = []
  const bSamples: number[] = []
  for (let i = 0; i < reps; i++) {
    aSamples.push(await timedAsync(() => runScenarioA(inputs)))
    bSamples.push(timedSync(() => runScenarioB(inputs)))
  }

  const aColdMs = aSamples[0] ?? 0
  const bColdMs = bSamples[0] ?? 0
  const aWarmSamples = aSamples.slice(1)
  const bWarmSamples = bSamples.slice(1)

  const a = summarize({
    scenario: 'A',
    label: 'native deriveAddressesFromXpubs (batched), warm',
    samples: aWarmSamples,
    accountsPerRun: n
  })
  const b = summarize({
    scenario: 'B',
    label: 'JS deriveAddressesFromXpub (per-account loop), warm',
    samples: bWarmSamples,
    accountsPerRun: n
  })

  const ratio = (x: number, y: number): string =>
    y === 0 ? 'n/a' : `${(x / y).toFixed(2)}x`
  const ratioNum = (x: number, y: number): number =>
    y === 0 ? 0 : Number((x / y).toFixed(2))

  const perNEntry: PerNResult = {
    accountCount: n,
    repeats: reps,
    aColdMs: Number(aColdMs.toFixed(2)),
    bColdMs: Number(bColdMs.toFixed(2)),
    scenarios: [a, b],
    deltas: {
      bVsAWarm: `B vs A (warm): ${ratio(b.medianMs, a.medianMs)}`,
      bVsACold: `B vs A (cold): ${ratio(bColdMs, aColdMs)}`,
      aColdVsWarm: `A cold vs warm: ${ratio(aColdMs, a.medianMs)} slower cold`,
      bColdVsWarm: `B cold vs warm: ${ratio(bColdMs, b.medianMs)} slower cold`
    }
  }

  const matrixEntry: XpubBenchmarkResult['matrix'][number] = {
    n,
    aColdMs: Number(aColdMs.toFixed(2)),
    aWarmMs: Number(a.medianMs.toFixed(2)),
    bColdMs: Number(bColdMs.toFixed(2)),
    bWarmMs: Number(b.medianMs.toFixed(2)),
    aColdPerAccountMs: Number((aColdMs / Math.max(1, n)).toFixed(3)),
    aWarmPerAccountMs: Number(a.medianMsPerAccount.toFixed(3)),
    bColdPerAccountMs: Number((bColdMs / Math.max(1, n)).toFixed(3)),
    bWarmPerAccountMs: Number(b.medianMsPerAccount.toFixed(3)),
    bVsAWarm: ratioNum(b.medianMs, a.medianMs),
    bVsACold: ratioNum(bColdMs, aColdMs),
    aColdVsWarm: ratioNum(aColdMs, a.medianMs),
    bColdVsWarm: ratioNum(bColdMs, b.medianMs)
  }

  return { perNEntry, matrixEntry }
}

export async function runXpubDerivationBenchmark(
  partial: Partial<XpubBenchmarkConfig> = {}
): Promise<XpubBenchmarkResult> {
  const cfg: XpubBenchmarkConfig = {
    ...DEFAULT_XPUB_BENCHMARK_CONFIG,
    ...partial
  }
  const startedAt = new Date().toISOString()

  // Build the full xpub set once (largest N) — generation cost shouldn't
  // skew per-scenario timings.
  const maxN = cfg.accountCounts.reduce((m, n) => Math.max(m, n), 0)
  const xpubGenT0 = now()
  const allXpubs = buildXpubsForN(maxN)
  const xpubGenMs = now() - xpubGenT0

  const perN: PerNResult[] = []
  const matrix: XpubBenchmarkResult['matrix'] = []

  for (const n of cfg.accountCounts) {
    if (n <= 0) continue
    const inputs: ScenarioInputs = {
      evmXpub: allXpubs.evmXpub,
      avalancheXpubs: allXpubs.avalancheXpubs.slice(0, n),
      accountIndices: allXpubs.accountIndices.slice(0, n),
      isTestnet: cfg.isTestnet
    }
    const { perNEntry, matrixEntry } = await runForN({ n, cfg, inputs })
    perN.push(perNEntry)
    matrix.push(matrixEntry)
  }

  const result: XpubBenchmarkResult = {
    config: cfg,
    xpubGenMs,
    perN,
    matrix,
    startedAt,
    finishedAt: new Date().toISOString()
  }

  // eslint-disable-next-line no-console
  console.log('[xpubDerivationBenchmark]', JSON.stringify(result, null, 2))

  return result
}
