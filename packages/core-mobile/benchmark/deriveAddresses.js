/* eslint-disable no-console */
import ModuleManager from 'vmModule/ModuleManager'
import { showResult } from './utils'

const ITERATIONS = 20

/**
 * Benchmarks ModuleManager.deriveAddresses across 20 different account indices.
 * Must be called with the active wallet's id and type from the app.
 */
export const deriveAddressesBenchmark = async ({ walletId, walletType }) => {
  if (!walletId || !walletType) {
    throw new Error(
      'deriveAddressesBenchmark requires walletId and walletType'
    )
  }

  const network = { isTestnet: false }
  const times = []

  // Warm-up run (index 0) — not counted
  console.log('[benchmark] warm-up deriveAddresses index=0')
  await ModuleManager.deriveAddresses({
    walletId,
    walletType,
    accountIndex: 0,
    network
  })

  // Timed runs: indices 0..19
  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`[benchmark] deriveAddresses index=${i}`)
    const start = performance.now()
    await ModuleManager.deriveAddresses({
      walletId,
      walletType,
      accountIndex: i,
      network
    })
    const elapsed = performance.now() - start
    times.push(elapsed)
    console.log(`[benchmark]   index=${i} -> ${elapsed.toFixed(1)}ms`)
  }

  const total = times.reduce((a, b) => a + b, 0)
  const avg = total / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)
  const sorted = [...times].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]

  const lines = [
    `Iterations: ${ITERATIONS}`,
    `Total: ${total.toFixed(1)}ms`,
    `Avg: ${avg.toFixed(1)}ms`,
    `Median: ${median.toFixed(1)}ms`,
    `Min: ${min.toFixed(1)}ms`,
    `Max: ${max.toFixed(1)}ms`,
    '',
    'Per-index breakdown:',
    ...times.map((t, i) => `  index ${i}: ${t.toFixed(1)}ms`)
  ]

  const message = lines.join('\n')
  console.log('[benchmark] deriveAddresses results:\n' + message)

  await showResult('deriveAddresses Benchmark', message)
}
