import { isAddress } from '@ethersproject/address'
import { isBech32Address } from '@avalabs/bridge-sdk'

export function getContactValidationError(
  name?: string,
  address?: string,
  addressBtc?: string
) {
  if (!name) {
    return 'Name required'
  }
  if (!address && !addressBtc) {
    return 'Address required'
  }
  if (address && !isAddress(address)) {
    return 'Not valid EVM address'
  }
  if (addressBtc && !isBech32Address(addressBtc)) {
    return 'invalid BTC address'
  }
  return undefined
}
