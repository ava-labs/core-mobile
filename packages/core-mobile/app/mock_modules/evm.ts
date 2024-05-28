import { NetworkVMType } from '@avalabs/chains-sdk'
import { Module } from './types'

export const evm: Module = {
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
  },
  getVMType: () => {
    return NetworkVMType.EVM
  }
}
