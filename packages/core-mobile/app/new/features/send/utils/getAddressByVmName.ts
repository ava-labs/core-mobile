import { NetworkVMType } from '@avalabs/vm-module-types'
import { isValidAddressByVmName } from 'features/accountSettings/utils/isValidAddressByVmName'
import { Contact } from 'store/addressBook'

/**
 * @description Checks if the contact has an address based on the vmName and developer mode.
 * @param contact - The contact to check.
 * @param vmName - The vmName to check against.
 * @param isDeveloperMode - Whether the app is in developer mode.
 * @returns address if the contact has an address for the given vmName and developer mode, undefined otherwise.
 */
export const getAddressByVmName = ({
  contact,
  vmName,
  isDeveloperMode
}: {
  contact: Contact
  vmName?: NetworkVMType
  isDeveloperMode: boolean
}): string | undefined => {
  if (
    contact.address &&
    isValidAddressByVmName({
      vmName,
      address: contact.address,
      isDeveloperMode
    })
  ) {
    return contact.address
  }

  if (
    contact.addressXP &&
    isValidAddressByVmName({
      vmName,
      address: contact.addressXP,
      isDeveloperMode
    })
  ) {
    return contact.addressXP
  }

  if (
    contact.addressBTC &&
    isValidAddressByVmName({
      vmName,
      address: contact.addressBTC,
      isDeveloperMode
    })
  ) {
    return contact.addressBTC
  }

  return undefined
}
