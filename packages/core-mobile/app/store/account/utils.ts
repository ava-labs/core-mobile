import { AVM, EVM, PVM, VM } from '@avalabs/avalanchejs'
import { Account } from 'store/account/types'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'

export function getAddressByVM(
  vm: VM,
  account: Account | undefined
): string | undefined {
  if (!account) {
    return
  }

  if (vm === AVM) {
    return account.addressAVM
  } else if (vm === PVM) {
    return account.addressPVM
  } else if (vm === EVM) {
    return account.addressCoreEth
  }
}

export function stripChainAddress(address: string): string {
  return address.slice(2)
}

export function getAddressByNetwork(
  account: Account,
  network: Network
): string {
  switch (network.vmName) {
    case NetworkVMType.EVM:
      return account.address
    case NetworkVMType.BITCOIN:
      return account.addressBtc
    case NetworkVMType.AVM:
      if (!account.addressXP) {
        throw new Error('AVM address not present')
      }
      return 'X-' + account.addressXP
    case NetworkVMType.PVM:
      if (!account.addressXP) {
        throw new Error('PVM address not present')
      }
      return 'P-' + account.addressXP
    case NetworkVMType.CoreEth:
      if (!account.addressCoreEth) {
        throw new Error('CoreEth address not present')
      }
      return account.addressCoreEth
    default:
      throw new Error('unsupported network ' + network.vmName)
  }
}
