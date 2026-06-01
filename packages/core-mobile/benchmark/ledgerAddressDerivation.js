/* eslint-disable no-console */

// Compares the old per-index/per-network sequential Ledger BIP44 address
// derivation against the new batched + parallel `deriveLedgerAddressesFromXpubs`.
// Both consume the same xpubs, so the delta isolates the batching/parallelism
// change — no Ledger device, no network I/O.
//
// xpubs are public keys (valid mainnet xpubs lifted from existing repo test
// fixtures). Address-encoding cost is independent of the xpub's value, so a
// single xpub is replicated across N synthetic account indices.

import { deriveAddressesFromXpubs } from '@avalabs/crypto-sdk'
import { deriveLedgerAddressesFromXpubs } from '../app/new/features/ledger/utils/deriveLedgerAddressesFromXpubs'
import { showResult } from './utils'

// Valid mainnet xpubs from app/services/wallet/{KeystoneWallet,
// BitcoinWalletPolicyService}.test.ts. Any valid xpub works — only the
// encoder's throughput is under test, not the resulting addresses.
const EVM_XPUB =
  'xpub661MyMwAqRbcFFDMuFiGQmA1EqWxxgDLdtNvxxiucf9qkfoVrvwgnYyshxWoewWtkZ1aLhKoVDrpeDvn1YRqxX2szhGKi3UiSEv1hYRMF8q'
const AVALANCHE_XPUB =
  'xpub6CUGRUonZSQ4TWtTMmzXdrXDtyPWKiKbERr4FqXdCqjrzN6TzbxQi2jPe8YQPCW9ZXAN7CCUNJfrCvQJDivQPw4qvdRyZL3sKRfqv9WwLxT'

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

// OLD approach: one account index at a time, mainnet then testnet sequentially.
const deriveSequential = async indices => {
  for (const i of indices) {
    await deriveAddressesFromXpubs(EVM_XPUB, [AVALANCHE_XPUB], false, [i])
    await deriveAddressesFromXpubs(EVM_XPUB, [AVALANCHE_XPUB], true, [i])
  }
}

// NEW approach: all indices in a single batched call, mainnet + testnet parallel.
const deriveBatch = (avalancheXpubs, indices) =>
  deriveLedgerAddressesFromXpubs(EVM_XPUB, avalancheXpubs, indices)

export const ledgerAddressDerivationBenchmark = async () => {
  // Warm up native init once at the largest N so it isn't charged to the
  // first measured run.
  const maxIndices = Array.from(
    { length: SIZES[SIZES.length - 1] },
    (_, k) => k
  )
  await deriveBatch(
    maxIndices.map(() => AVALANCHE_XPUB),
    maxIndices
  )

  const lines = [
    `N    | baseline ms     | batch ms        | speedup`,
    `     | median (mean)   | median (mean)   |`,
    `-----|-----------------|-----------------|--------`
  ]

  for (const n of SIZES) {
    const indices = Array.from({ length: n }, (_, k) => k)
    const avalancheXpubs = indices.map(() => AVALANCHE_XPUB)

    const baselineRuns = []
    for (let r = 0; r < RUNS_PER_SIZE; r++) {
      baselineRuns.push(await timeMs(() => deriveSequential(indices)))
    }

    const batchRuns = []
    for (let r = 0; r < RUNS_PER_SIZE; r++) {
      batchRuns.push(await timeMs(() => deriveBatch(avalancheXpubs, indices)))
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

  await showResult('Ledger Address Derivation Benchmark', lines.join('\n'))
}
