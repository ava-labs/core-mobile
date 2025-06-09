import { AVM, EVM, PVM, VM } from '@avalabs/avalanchejs'
import { Account, AccountCollection } from 'store/account/types'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'

export function getAddressByVM(
  vm: VM,
  account: Account | undefined
): string | undefined {
  if (!account) {
    return
  }

  switch (vm) {
    case AVM:
      return account.addressAVM
    case PVM:
      return account.addressPVM
    case EVM:
      return account.addressCoreEth
  }
}

export function stripChainAddress(address: string): string {
  if (
    address.toLowerCase().startsWith('p-') ||
    address.toLowerCase().startsWith('c-') ||
    address.toLowerCase().startsWith('x-')
  )
    return address.slice(2)
  return address
}

export function getAddressByNetwork(
  account: Account,
  network: Network
): string {
  switch (network.vmName) {
    case NetworkVMType.EVM:
      return account.addressC
    case NetworkVMType.BITCOIN:
      return account.addressBTC
    case NetworkVMType.AVM:
      return account.addressAVM
    case NetworkVMType.PVM:
      return account.addressPVM
    case NetworkVMType.CoreEth:
      return account.addressCoreEth
    case NetworkVMType.SVM:
      return '52C9T2T7JRojtxumYnYZhyUmrN7kqzvCLc4Ksvjk7TxD' // TODO: replace with accountSVM when thats
    default:
      throw new Error('unsupported network ' + network.vmName)
  }
}

export const mergeAccounts = (
  existingAccounts: AccountCollection,
  accounts: AccountCollection
): AccountCollection => {
  return {
    ...existingAccounts,
    ...accounts
  }
}
