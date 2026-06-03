/* eslint-disable no-console */

// Compares sequential `ModuleManager.deriveAddresses` vs batch
// `deriveAllAddresses`. Both share the same pubkey source, so the delta
// isolates the per-module batch encoders.

import { Alert } from 'react-native'
import ModuleManager from 'vmModule/ModuleManager'
import { selectActiveWallet } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { showResult } from './utils'

const SIZES = [1, 5, 20, 50, 100]
const RUNS_PER_SIZE = 5 // 5 runs, drop min+max, report median+mean of remaining 3

const median = arr => {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}
const mean = arr => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
const trimmed = arr => {
  const sorted = [...arr].sort((a, b) => a - b)
  return sorted.slice(1, sorted.length - 1) // drop min + max
}

const timeMs = async fn => {
  const t0 = Date.now()
  await fn()
  return Date.now() - t0
}

export const addressDerivationBenchmark = async store => {
  const state = store.getState()
  const activeWallet = selectActiveWallet(state)

  if (!activeWallet) {
    Alert.alert(
      'Benchmark unavailable',
      'No active wallet. Sign in to a mnemonic wallet first.'
    )
    return
  }
  if (activeWallet.type !== WalletType.MNEMONIC) {
    Alert.alert(
      'Benchmark unavailable',
      `This benchmark requires a MNEMONIC wallet; current walletType is ${activeWallet.type}.`
    )
    return
  }

  const walletId = activeWallet.id
  const walletType = activeWallet.type
  const network = { isTestnet: false }

  // Warm up: prime pubkey caches for the largest N once so cache state is
  // equivalent across both code paths. The benchmark measures address
  // encoding throughput, not pubkey-derivation throughput.
  const maxIndices = Array.from(
    { length: SIZES[SIZES.length - 1] },
    (_, k) => k
  )
  await ModuleManager.deriveAllAddresses({
    walletId,
    walletType,
    accountIndices: maxIndices,
    network
  })

  const lines = [
    `N    | baseline ms     | batch ms        | speedup`,
    `     | median (mean)   | median (mean)   |`,
    `-----|-----------------|-----------------|--------`
  ]

  for (const n of SIZES) {
    const indices = Array.from({ length: n }, (_, k) => k)

    const baselineRuns = []
    for (let r = 0; r < RUNS_PER_SIZE; r++) {
      baselineRuns.push(
        await timeMs(async () => {
          for (const accountIndex of indices) {
            await ModuleManager.deriveAddresses({
              walletId,
              walletType,
              accountIndex,
              network
            })
          }
        })
      )
    }

    const batchRuns = []
    for (let r = 0; r < RUNS_PER_SIZE; r++) {
      batchRuns.push(
        await timeMs(async () => {
          await ModuleManager.deriveAllAddresses({
            walletId,
            walletType,
            accountIndices: indices,
            network
          })
        })
      )
    }

    const b = trimmed(baselineRuns)
    const x = trimmed(batchRuns)
    const bMed = median(b)
    const bMean = mean(b)
    const xMed = median(x)
    const xMean = mean(x)
    const speedup = xMed > 0 ? (bMed / xMed).toFixed(1) + 'x' : 'inf'

    lines.push(
      `${String(n).padEnd(4)} | ${String(bMed).padStart(4)} (${String(
        bMean
      ).padStart(4)})    | ${String(xMed).padStart(4)} (${String(
        xMean
      ).padStart(4)})    | ${speedup}`
    )
    console.log(lines[lines.length - 1])
  }

  await showResult('Address Derivation Benchmark', lines.join('\n'))
}
