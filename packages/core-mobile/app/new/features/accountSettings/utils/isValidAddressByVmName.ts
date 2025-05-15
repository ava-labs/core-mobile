import { NetworkVMType } from '@avalabs/vm-module-types'
import { AddressType } from 'features/accountSettings/consts'
import { isValidAddress } from 'features/accountSettings/utils/isValidAddress'

export const isValidAddressByVmName = ({
  address,
  vmName,
  isDeveloperMode
}: {
  address: string
  vmName?: NetworkVMType
  isDeveloperMode: boolean
}): boolean => {
  if (vmName === undefined) {
    return isValidAddress({
      address,
      isDeveloperMode
    })
  }

  if (
    vmName === NetworkVMType.EVM &&
    isValidAddress({
      addressType: isDeveloperMode ? AddressType.EVM : AddressType.EVM_TESTNET,
      address,
      isDeveloperMode
    })
  ) {
    return true
  }

  if (
    (vmName === NetworkVMType.PVM || vmName === NetworkVMType.AVM) &&
    isValidAddress({
      addressType: isDeveloperMode ? AddressType.XP_TESTNET : AddressType.XP,
      address,
      isDeveloperMode
    })
  ) {
    return true
  }

  return (
    vmName === NetworkVMType.BITCOIN &&
    isValidAddress({
      addressType: isDeveloperMode ? AddressType.BTC_TESTNET : AddressType.BTC,
      address,
      isDeveloperMode
    })
  )
}
