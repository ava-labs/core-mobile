/* eslint-disable no-console */
import { showResult } from './utils'
import { mnemonicToSeed } from 'bip39'
import { deriveAllAddressesFromSeed } from 'react-native-nitro-avalabs-crypto'
import { NetworkVMType } from '@avalabs/vm-module-types'
import ModuleManager from '../app/vmModule/ModuleManager'
import WalletFactory from '../app/services/wallet/WalletFactory'
import BiometricsSDK from '../app/utils/BiometricsSDK'
import { WalletType } from '../app/services/wallet/types'

const Ns = [1, 5, 20, 50, 100]
const RUNS = 5 // drop min + max → 3 timed
const FRAME_BUDGET_MS = 33 // anything over ~30fps counts as a dropped frame

const median = arr => {
  const a = [...arr].sort((x, y) => x - y)
  return a[Math.floor(a.length / 2)]
}
const mean = arr => arr.reduce((s, v) => s + v, 0) / arr.length

const frameTracker = () => {
  let lags = []
  let last = 0
  let id = null
  const tick = () => {
    const now = performance.now()
    const lag = now - last
    if (lag > FRAME_BUDGET_MS) lags.push(lag)
    last = now
    id = requestAnimationFrame(tick)
  }
  return {
    start: () => {
      lags = []
      last = performance.now()
      id = requestAnimationFrame(tick)
    },
    stop: () => {
      if (id != null) cancelAnimationFrame(id)
      id = null
      return lags
    }
  }
}

/**
 * Compare cold address derivation: ModuleManager loop vs native batch.
 *
 * @param {Object} args
 * @param {string} args.walletId         active mnemonic wallet id (Redux selectActiveWalletId)
 * @param {WalletType} args.walletType   should be WalletType.MNEMONIC
 * @param {boolean} [args.isTestnet]     defaults to false (mainnet)
 */
export const addressDerivationBenchmark = async ({
  walletId,
  walletType,
  isTestnet = false
}) => {
  if (!walletId || walletType !== WalletType.MNEMONIC) {
    return showResult(
      'Bench skipped',
      'Active wallet must be a MNEMONIC wallet — pass walletId + WalletType.MNEMONIC.'
    )
  }

  // Stub network — modules only read network.isTestnet; matches AccountsService pattern.
  const network = { isTestnet }

  // --- Setup (untimed) ---
  const secret = await BiometricsSDK.loadWalletSecret(walletId)
  if (!secret.success) {
    return showResult('Bench failed', 'Could not load wallet secret')
  }
  const seed = await mnemonicToSeed(secret.value)
  const seedBuffer = seed.buffer.slice(
    seed.byteOffset,
    seed.byteOffset + seed.byteLength
  )

  await ModuleManager.init()

  // --- Correctness gate (N=20) ---
  console.log('[bench] correctness gate at N=20')
  const checkN = 20
  const checkIdx = Array.from({ length: checkN }, (_, i) => i)

  const nativeCheck = await deriveAllAddressesFromSeed(
    seedBuffer,
    checkIdx,
    isTestnet
  )

  WalletFactory.cache.clearAll()
  const baselineCheck = []
  for (const i of checkIdx) {
    baselineCheck.push(
      await ModuleManager.deriveAddresses({
        walletId,
        walletType,
        accountIndex: i,
        network
      })
    )
  }

  const fields = [
    ['evm', NetworkVMType.EVM],
    ['btc', NetworkVMType.BITCOIN],
    ['avm', NetworkVMType.AVM],
    ['pvm', NetworkVMType.PVM],
    ['coreEth', NetworkVMType.CoreEth],
    ['solana', NetworkVMType.SVM]
  ]
  const mismatches = []
  for (let i = 0; i < checkN; i++) {
    for (const [n, b] of fields) {
      const ne = nativeCheck[i]?.[n]
      const ba = baselineCheck[i]?.[b]
      if (ne !== ba)
        mismatches.push(`${n}[${i}]\n  native=${ne}\n  base  =${ba}`)
    }
  }
  if (mismatches.length > 0) {
    return showResult(
      'MISMATCH — bench aborted',
      mismatches.slice(0, 5).join('\n\n')
    )
  }
  console.log('[bench] addresses match — proceeding')

  // --- Warmup (untimed) ---
  console.log('[bench] warmup')
  const warmIdx = [0, 1, 2, 3, 4]
  WalletFactory.cache.clearAll()
  for (const i of warmIdx) {
    await ModuleManager.deriveAddresses({
      walletId,
      walletType,
      accountIndex: i,
      network
    })
  }
  await deriveAllAddressesFromSeed(seedBuffer, warmIdx, isTestnet)

  // --- Measure ---
  const tracker = frameTracker()
  const results = {}

  for (const N of Ns) {
    console.log(`[bench] N=${N}`)
    const idx = Array.from({ length: N }, (_, i) => i)
    const baselineMs = []
    const nativeMs = []
    let baselineDropped = 0
    let nativeDropped = 0
    let baselineWorst = 0
    let nativeWorst = 0

    for (let r = 0; r < RUNS; r++) {
      // Baseline cold (clear wallet/seed/master caches)
      WalletFactory.cache.clearAll()
      tracker.start()
      const t0 = performance.now()
      for (const i of idx) {
        // eslint-disable-next-line no-await-in-loop
        await ModuleManager.deriveAddresses({
          walletId,
          walletType,
          accountIndex: i,
          network
        })
      }
      const t1 = performance.now()
      const bLags = tracker.stop()
      baselineMs.push(t1 - t0)
      baselineDropped += bLags.length
      baselineWorst = Math.max(baselineWorst, ...bLags, 0)

      // Native cold (no wallet cache to clear — native takes raw seed)
      tracker.start()
      const t2 = performance.now()
      // eslint-disable-next-line no-await-in-loop
      await deriveAllAddressesFromSeed(seedBuffer, idx, isTestnet)
      const t3 = performance.now()
      const nLags = tracker.stop()
      nativeMs.push(t3 - t2)
      nativeDropped += nLags.length
      nativeWorst = Math.max(nativeWorst, ...nLags, 0)
    }

    // Drop min and max from each
    baselineMs.sort((a, b) => a - b)
    baselineMs.shift()
    baselineMs.pop()
    nativeMs.sort((a, b) => a - b)
    nativeMs.shift()
    nativeMs.pop()

    results[N] = {
      bMed: median(baselineMs),
      bMean: mean(baselineMs),
      nMed: median(nativeMs),
      nMean: mean(nativeMs),
      bDropped: baselineDropped,
      nDropped: nativeDropped,
      bWorst: baselineWorst,
      nWorst: nativeWorst
    }
  }

  // --- Report ---
  const lines = []
  lines.push('Address Derivation Benchmark — cold mode')
  lines.push(`${RUNS} runs/N, drop min+max → ${RUNS - 2} timed; isTestnet=${isTestnet}`)
  lines.push('')
  lines.push('N    | baseline ms     | native ms       | speedup')
  lines.push('     | median (mean)   | median (mean)   |        ')
  lines.push('-----|-----------------|-----------------|--------')
  for (const N of Ns) {
    const r = results[N]
    const sp = r.nMed > 0 ? r.bMed / r.nMed : 0
    lines.push(
      `${String(N).padEnd(4)} | ${r.bMed.toFixed(0).padStart(5)} (${r.bMean
        .toFixed(0)
        .padStart(5)})   | ${r.nMed.toFixed(0).padStart(5)} (${r.nMean
        .toFixed(0)
        .padStart(5)})   | ${sp.toFixed(1)}x`
    )
  }
  lines.push('')
  lines.push('JS-thread frame drops (gap > 33ms) across all runs/N:')
  lines.push('N    | baseline drops/worst | native drops/worst')
  for (const N of Ns) {
    const r = results[N]
    lines.push(
      `${String(N).padEnd(4)} | ${String(r.bDropped).padStart(
        6
      )} / ${r.bWorst.toFixed(0)}ms  | ${String(r.nDropped).padStart(
        6
      )} / ${r.nWorst.toFixed(0)}ms`
    )
  }

  await showResult('Address Derivation Benchmark', lines.join('\n'))
}
