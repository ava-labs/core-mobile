import { Module, parseManifest } from './types'
import manifest from './pvm.manifest.json'

export const pvm: Module = {
  getManifest: () => {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  },
  getBalances: () => {
    return Promise.resolve('Pvm balances')
  },
  getTransactionHistory: () => {
    return Promise.resolve('Pvm transaction history')
  },
  getNetworkFee: () => {
    return Promise.resolve('Pvm network fee')
  },
  getAddress: () => {
    return Promise.resolve('Pvm address')
  }
}
