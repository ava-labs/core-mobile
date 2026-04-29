/* eslint-disable no-console */
import { Alert } from 'react-native'
import { nobleVsQuickCryptoHashBenchmark } from './hashes'
import { bip32Benchmark } from './bip32'
import { deriveAddressesBenchmark } from './deriveAddresses'

const benchmarks = [
  { name: 'noble vs quick-crypto hash', fn: nobleVsQuickCryptoHashBenchmark },
  { name: 'bip32', fn: bip32Benchmark }
]

/**
 * Run all benchmarks sequentially with skip/run prompts.
 */
export const runBenchmark = async () => {
  let index = 0

  const runNext = () => {
    if (index >= benchmarks.length) return

    const { name, fn } = benchmarks[index]
    Alert.alert('Benchmark', `Run ${name} benchmark?`, [
      {
        text: 'Skip',
        style: 'cancel',
        onPress: () => {
          index++
          runNext()
        }
      },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await fn()
          } catch (err) {
            console.log(`Error in ${name}:`, err)
          }
          index++
          runNext()
        }
      }
    ])
  }

  runNext()
}

/**
 * Run deriveAddresses benchmark independently.
 * Call with the active wallet context from the app:
 *
 *   import { runDeriveAddressesBenchmark } from 'benchmark'
 *   runDeriveAddressesBenchmark({ walletId, walletType })
 */
export const runDeriveAddressesBenchmark = async ({ walletId, walletType }) => {
  try {
    await deriveAddressesBenchmark({ walletId, walletType })
  } catch (err) {
    console.log('Error in deriveAddresses benchmark:', err)
    Alert.alert('Benchmark Error', String(err))
  }
}
