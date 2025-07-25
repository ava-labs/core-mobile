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

  if (vmName === NetworkVMType.EVM) {
    return isValidAddress({
      addressType: isDeveloperMode ? AddressType.EVM : AddressType.EVM_TESTNET,
      address,
      isDeveloperMode
    })
  }

  if (vmName === NetworkVMType.PVM || vmName === NetworkVMType.AVM) {
    return isValidAddress({
      addressType: isDeveloperMode ? AddressType.XP_TESTNET : AddressType.XP,
      address,
      isDeveloperMode
    })
  }

  if (vmName === NetworkVMType.SVM) {
    return isValidAddress({
      addressType: isDeveloperMode
        ? AddressType.SOLANA_DEVNET
        : AddressType.SOLANA,
      address,
      isDeveloperMode
    })
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
