import { Module, parseManifest } from './types'
import manifest from './bitcoin.manifest.json'

export const bitcoin: Module = {
  getManifest: () => {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  },
  getBalances: () => {
    return Promise.resolve('Bitcoin balances')
  },
  getTransactionHistory: () => {
    return Promise.resolve('Bitcoin transaction history')
  },
  getNetworkFee: () => {
    return Promise.resolve('Bitcoin network fee')
  },
  getAddress: () => {
    return Promise.resolve('Bitcoin address')
  }
}
