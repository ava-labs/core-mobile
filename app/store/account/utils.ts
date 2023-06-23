import { AVM, EVM, PVM, VM } from '@avalabs/avalanchejs-v2'
import { Account } from 'store/account/types'

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
