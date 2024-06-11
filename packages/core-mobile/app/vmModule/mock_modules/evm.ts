import { Module, parseManifest } from './types'
import manifest from './evm.manifest.json'

export const evm: Module = {
  getManifest: () => {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  },
  getBalances: () => {
    return Promise.resolve('EVM balances')
  },
  getTransactionHistory: () => {
    return Promise.resolve('EVM transaction history')
  },
  getNetworkFee: () => {
    return Promise.resolve('EVM network fee')
  },
  getAddress: () => {
    return Promise.resolve('EVM address')
  }
}
