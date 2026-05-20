/**
 * ModuleManager derive benchmark (dev-only).
 *
 * For each value of N in `accountCounts`, compares two ways of deriving
 * the per-VM address set for the first N account indices, in both cache
 * states:
 *
 *   A_cold  ModuleManager.deriveAddresses     (per-account × N)  cache cleared
 *   A_warm  ModuleManager.deriveAddresses     (per-account × N)  cache warm
 *   B_cold  ModuleManager.deriveAllAddresses  (batched)           cache cleared
 *   B_warm  ModuleManager.deriveAllAddresses  (batched)           cache warm
 *
 * Each rep clears the pubkey cache, times the cold call, then immediately
 * times the warm call against the cache populated by the cold call —
 * fresh cold/warm pair per rep, no carryover between A and B.
 *
 * The cache clear targets only the derived pubkey/xpub caches; the wallet
 * instance stays cached so cold timings don't include the one-time
 * mnemonic-decryption + bip39 seed cost.
 *
 * Tied to the active signed-in wallet. Skips Ledger / Keystone / Seedless
 * wallets — `deriveAddresses` would block scenario A on the device.
 *
 * Output: console.log a structured JSON blob + an Alert table.
 *
 * Delete or gate before merge — for CP-14062 follow-up benchmarking only.
 */

import { Network } from '@avalabs/core-chains-sdk'
import { WalletType } from 'services/wallet/types'
import WalletFactory from 'services/wallet/WalletFactory'
import ModuleManager from 'vmModule/ModuleManager'

// -------------------------------------------------------------------------
// Config
// -------------------------------------------------------------------------

export interface ModuleManagerBenchmarkConfig {
  walletId: string
  walletType: WalletType
  accountCounts: number[]
  isTestnet: boolean
  // Set both to null to use the adaptive heuristic (more samples at small
  // N, fewer at large N). Otherwise applies the constant to every N.
  repeats: number | null
  warmupRepeats: number | null
}

export const DEFAULT_MODULE_MANAGER_BENCHMARK_CONFIG: Omit<
  ModuleManagerBenchmarkConfig,
  'walletId' | 'walletType'
> = {
  accountCounts: [1, 5, 10, 20, 50],
  isTestnet: false,
  repeats: null,
  warmupRepeats: null
}

// `deriveAddresses` dominates wall time at large N (sequential per-account
// vm-module calls). Cap repeats hard and clamp to [3, 30].
function repeatsFor(n: number, explicit: number | null): number {
  if (explicit !== null) return Math.max(1, explicit)
  return Math.max(3, Math.min(30, Math.floor(120 / Math.max(1, n))))
}

function warmupRepeatsFor(n: number, explicit: number | null): number {
  if (explicit !== null) return Math.max(0, explicit)
  return Math.max(1, Math.min(3, Math.floor(repeatsFor(n, null) / 4)))
}

// -------------------------------------------------------------------------
// Stats
// -------------------------------------------------------------------------

type ScenarioKey = 'A_cold' | 'A_warm' | 'B_cold' | 'B_warm'

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
  // medianMs / N — per-account normalization for easy cross-N comparison.
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
// Scenarios
// -------------------------------------------------------------------------

interface ScenarioInputs {
  walletId: string
  walletType: WalletType
  network: Network
  accountIndices: number[]
}

// Per-account, sequential. Matches the legacy windowed-loop pattern used
// by AccountsService.discoverSeedBasedActiveAccounts before CP-14062.
async function runScenarioA(inputs: ScenarioInputs): Promise<void> {
  for (const accountIndex of inputs.accountIndices) {
    await ModuleManager.deriveAddresses({
      walletId: inputs.walletId,
      walletType: inputs.walletType,
      accountIndex,
      network: inputs.network
    })
  }
}

// Single batched call for the whole window.
async function runScenarioB(inputs: ScenarioInputs): Promise<void> {
  await ModuleManager.deriveAllAddresses({
    walletId: inputs.walletId,
    walletType: inputs.walletType,
    accountIndices: inputs.accountIndices,
    network: inputs.network
  })
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
    // How much faster is B than A at each cache state, and how much does
    // the cache buy each method.
    bVsACold: string
    bVsAWarm: string
    aColdVsWarm: string
    bColdVsWarm: string
  }
}

export interface ModuleManagerBenchmarkResult {
  config: ModuleManagerBenchmarkConfig
  perN: PerNResult[]
  // Compact summary row per N — handy for pasting into the brain.
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
    bVsACold: number
    bVsAWarm: number
    aColdVsWarm: number
    bColdVsWarm: number
  }>
  startedAt: string
  finishedAt: string
}

const now = (): number => globalThis.performance?.now?.() ?? Date.now()

async function timed(fn: () => Promise<void> | void): Promise<number> {
  const t0 = now()
  await fn()
  return now() - t0
}

async function runForN({
  n,
  cfg
}: {
  n: number
  cfg: ModuleManagerBenchmarkConfig
}): Promise<{
  perNEntry: PerNResult
  matrixEntry: ModuleManagerBenchmarkResult['matrix'][number]
}> {
  const accountIndices = Array.from({ length: n }, (_, i) => i)
  // vm-modules / deriveAllAddresses only read isTestnet from the network.
  const network = { isTestnet: cfg.isTestnet } as Network
  const inputs: ScenarioInputs = {
    walletId: cfg.walletId,
    walletType: cfg.walletType,
    network,
    accountIndices
  }
  const reps = repeatsFor(n, cfg.repeats)
  const warm = warmupRepeatsFor(n, cfg.warmupRepeats)

  // Warmup (discarded). Populates the wallet instance and any
  // module-internal first-call state so timed runs reflect steady state.
  for (let i = 0; i < warm; i++) {
    await runScenarioA(inputs)
    await runScenarioB(inputs)
  }

  // Interleaved cold/warm pairs per rep — each cold run starts from a
  // freshly cleared pubkey cache, then the immediately following warm
  // run measures against the cache populated by that cold run.
  const aColdSamples: number[] = []
  const aWarmSamples: number[] = []
  const bColdSamples: number[] = []
  const bWarmSamples: number[] = []
  for (let i = 0; i < reps; i++) {
    WalletFactory.cache.clearPublicKeys(cfg.walletId)
    aColdSamples.push(await timed(() => runScenarioA(inputs)))
    aWarmSamples.push(await timed(() => runScenarioA(inputs)))

    WalletFactory.cache.clearPublicKeys(cfg.walletId)
    bColdSamples.push(await timed(() => runScenarioB(inputs)))
    bWarmSamples.push(await timed(() => runScenarioB(inputs)))
  }

  const aCold = summarize({
    scenario: 'A_cold',
    label: 'ModuleManager.deriveAddresses (per-account × N, cold cache)',
    samples: aColdSamples,
    accountsPerRun: n
  })
  const aWarm = summarize({
    scenario: 'A_warm',
    label: 'ModuleManager.deriveAddresses (per-account × N, warm cache)',
    samples: aWarmSamples,
    accountsPerRun: n
  })
  const bCold = summarize({
    scenario: 'B_cold',
    label: 'ModuleManager.deriveAllAddresses (batched, cold cache)',
    samples: bColdSamples,
    accountsPerRun: n
  })
  const bWarm = summarize({
    scenario: 'B_warm',
    label: 'ModuleManager.deriveAllAddresses (batched, warm cache)',
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
    warmupRepeats: warm,
    scenarios: [aCold, aWarm, bCold, bWarm],
    deltas: {
      bVsACold: `B vs A (cold): ${ratio(
        aCold.medianMs,
        bCold.medianMs
      )} faster (median)`,
      bVsAWarm: `B vs A (warm): ${ratio(
        aWarm.medianMs,
        bWarm.medianMs
      )} faster (median)`,
      aColdVsWarm: `A cold vs warm: ${ratio(
        aCold.medianMs,
        aWarm.medianMs
      )} slower cold (median)`,
      bColdVsWarm: `B cold vs warm: ${ratio(
        bCold.medianMs,
        bWarm.medianMs
      )} slower cold (median)`
    }
  }

  const matrixEntry: ModuleManagerBenchmarkResult['matrix'][number] = {
    n,
    aColdMs: Number(aCold.medianMs.toFixed(2)),
    aWarmMs: Number(aWarm.medianMs.toFixed(2)),
    bColdMs: Number(bCold.medianMs.toFixed(2)),
    bWarmMs: Number(bWarm.medianMs.toFixed(2)),
    aColdPerAccountMs: Number(aCold.medianMsPerAccount.toFixed(3)),
    aWarmPerAccountMs: Number(aWarm.medianMsPerAccount.toFixed(3)),
    bColdPerAccountMs: Number(bCold.medianMsPerAccount.toFixed(3)),
    bWarmPerAccountMs: Number(bWarm.medianMsPerAccount.toFixed(3)),
    bVsACold: ratioNum(aCold.medianMs, bCold.medianMs),
    bVsAWarm: ratioNum(aWarm.medianMs, bWarm.medianMs),
    aColdVsWarm: ratioNum(aCold.medianMs, aWarm.medianMs),
    bColdVsWarm: ratioNum(bCold.medianMs, bWarm.medianMs)
  }

  return { perNEntry, matrixEntry }
}

export async function runModuleManagerDeriveBenchmark(
  partial: Partial<ModuleManagerBenchmarkConfig> & {
    walletId: string
    walletType: WalletType
  }
): Promise<ModuleManagerBenchmarkResult> {
  const cfg: ModuleManagerBenchmarkConfig = {
    ...DEFAULT_MODULE_MANAGER_BENCHMARK_CONFIG,
    ...partial
  }
  const startedAt = new Date().toISOString()

  // Ensure modules are initialized so scenario A's first call isn't
  // paying ModuleManager.init() cost.
  await ModuleManager.init()

  const perN: PerNResult[] = []
  const matrix: ModuleManagerBenchmarkResult['matrix'] = []

  for (const n of cfg.accountCounts) {
    if (n <= 0) continue
    const { perNEntry, matrixEntry } = await runForN({ n, cfg })
    perN.push(perNEntry)
    matrix.push(matrixEntry)
  }

  const result: ModuleManagerBenchmarkResult = {
    config: cfg,
    perN,
    matrix,
    startedAt,
    finishedAt: new Date().toISOString()
  }

  // eslint-disable-next-line no-console
  console.log('[moduleManagerDeriveBenchmark]', JSON.stringify(result, null, 2))

  return result
}
