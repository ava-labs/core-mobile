import { NetworkVMType } from '@avalabs/chains-sdk'
import { Module } from './types'

export const bitcoin: Module = {
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
  },
  getVMType: () => {
    return NetworkVMType.BITCOIN
  }
}
