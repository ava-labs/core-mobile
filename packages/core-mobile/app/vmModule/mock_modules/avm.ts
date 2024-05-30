import { Module, parseManifest } from './types'
import manifest from './avm.manifest.json'

export const avm: Module = {
  getManifest: () => {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  },
  getBalances: () => {
    return Promise.resolve('Avm balances')
  },
  getTransactionHistory: () => {
    return Promise.resolve('Avm transaction history')
  },
  getNetworkFee: () => {
    return Promise.resolve('Avm network fee')
  },
  getAddress: () => {
    return Promise.resolve('Avm address')
  }
}
