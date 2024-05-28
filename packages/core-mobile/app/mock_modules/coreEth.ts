import { NetworkVMType } from '@avalabs/chains-sdk'
import { Module } from './types'

export const coreEth: Module = {
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
  },
  getVMType: () => {
    return NetworkVMType.CoreEth
  }
}
