import { Contact } from '@avalabs/types'
import { stripChainAddress } from 'store/account/utils'
import { Account } from 'store/account'

export function getAddressProperty(obj: Contact | Account): string {
  if ('address' in obj) {
    return obj.address
  }
  if ('addressC' in obj) {
    return obj.addressC
  }
  throw new Error('Invalid input object')
}

/**
 * For Contact object it will return whatever is in it's addressXP prop.
 * For Account it will try to return address from either addressPVM or addressAVM prop,
 * whichever is not empty.
 * @return x/p address without chain prefix
 * @throws Error if object is neither Contact nor Account
 */
export function getAddressXP(obj: Contact | Account): string | undefined {
  if ('addressXP' in obj) {
    return obj.addressXP
  }

  if ('addressPVM' in obj && obj.addressPVM) {
    return stripChainAddress(obj.addressPVM)
  }

  if ('addressAVM' in obj && obj.addressAVM) {
    return stripChainAddress(obj.addressAVM)
  }

  throw new Error('Invalid input object')
}
