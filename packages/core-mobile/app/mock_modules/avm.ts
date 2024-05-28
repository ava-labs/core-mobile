import { Module, parseManifest } from './types'

export const avm: Module = {
  getManifest: () => {
    const manifest = require('./avm.manifest.json')
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
