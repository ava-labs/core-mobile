import { NetworkVMType } from '@avalabs/chains-sdk'
import { Module } from './types'

export const pvm: Module = {
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
  },
  getVMType: () => {
    return NetworkVMType.PVM
  }
}
