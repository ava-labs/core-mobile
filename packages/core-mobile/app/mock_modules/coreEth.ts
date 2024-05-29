import { Module, parseManifest } from './types'
import manifest from './coreEth.manifest.json'

export const coreEth: Module = {
  getManifest: () => {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  },
  getBalances: () => {
    return Promise.resolve('CoreEth balances')
  },
  getTransactionHistory: () => {
    return Promise.resolve('CoreEth transaction history')
  },
  getNetworkFee: () => {
    return Promise.resolve('CoreEth network fee')
  },
  getAddress: () => {
    return Promise.resolve('CoreEth address')
  }
}
