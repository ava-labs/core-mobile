import { Account, XPAddressDictionary } from 'store/account/types'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
/**
 * Transforms raw XP address data with fallback to account's addressPVM
 */
export function transformXPAddresses(
  queryData:
    | {
        xpAddresses?: Array<{ address: string }>
        xpAddressDictionary?: XPAddressDictionary
      }
    | undefined,
  account: Account | undefined
): {
  xpAddresses: string[]
  xpAddressDictionary: XPAddressDictionary
} {
  // Derive xpAddresses with fallback
  // Note: All addresses should be stripped of HRP prefix for consistency with SDK expectations
  let xpAddresses: string[] = []
  if (queryData?.xpAddresses && queryData.xpAddresses.length > 0) {
    xpAddresses = queryData.xpAddresses.map(x => stripAddressPrefix(x.address))
  } else if (account?.addressPVM) {
    xpAddresses = [stripAddressPrefix(account.addressPVM)]
  }

  // Derive xpAddressDictionary with fallback
  let xpAddressDictionary: XPAddressDictionary = {}
  if (queryData?.xpAddressDictionary) {
    xpAddressDictionary = queryData.xpAddressDictionary
  } else if (account?.addressPVM) {
    xpAddressDictionary = {
      [stripAddressPrefix(account.addressPVM)]: {
        space: 'e' as const,
        index: 0,
        hasActivity: false
      }
    }
  }

  return {
    xpAddresses,
    xpAddressDictionary
  }
}
