/* eslint-disable no-console */
import { Alert } from 'react-native'
import { nobleVsQuickCryptoHashBenchmark } from './hashes'
import { bip32Benchmark } from './bip32'
import { addressDerivationBenchmark } from './addressDerivation'

export const runBenchmark = async store => {
  const benchmarks = [
    { name: 'noble vs quick-crypto hash', fn: nobleVsQuickCryptoHashBenchmark },
    { name: 'bip32', fn: bip32Benchmark },
    {
      name: 'address derivation (single vs batch)',
      fn: () => addressDerivationBenchmark(store)
    }
  ]
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
