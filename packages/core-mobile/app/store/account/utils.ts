import { AVM, EVM, PVM, VM } from '@avalabs/avalanchejs'
import { Account, AccountCollection, PrimaryAccount } from 'store/account/types'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { CoreAccountType } from '@avalabs/types'

export function isPrimaryAccount(account: Account): account is PrimaryAccount {
  return account.type === CoreAccountType.PRIMARY
}

export function getAccountIndex(account: Account | undefined): number {
  if (!account) {
    return 0
  }
  return isPrimaryAccount(account) ? account.index : 0
}

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
