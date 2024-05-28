import { NetworkVMType } from '@avalabs/chains-sdk'
import { Module } from './types'

export const avm: Module = {
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
  },
  getVMType: () => {
    return NetworkVMType.AVM
  }
}
