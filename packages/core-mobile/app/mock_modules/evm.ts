import { Module, parseManifest } from './types'

export const evm: Module = {
  getManifest: () => {
    const manifest = require('./evm.manifest.json')
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
