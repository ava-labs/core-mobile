import { Module, parseManifest } from './types'

export const pvm: Module = {
  getManifest: () => {
    const manifest = require('./pvm.manifest.json')
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
