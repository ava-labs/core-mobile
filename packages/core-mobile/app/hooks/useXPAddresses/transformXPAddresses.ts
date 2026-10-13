import { Account, XPAddressDictionary } from 'store/account/types'
import {
  isBareChainPrefix,
  stripAddressPrefix
} from 'common/utils/stripAddressPrefix'
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
  // A bare 'P-' (Ledger account whose X/P derivation failed, CP-14964) would
  // strip to '' and poison both lists with an empty address.
  const primaryAddress =
    account?.addressPVM && !isBareChainPrefix(account.addressPVM)
      ? stripAddressPrefix(account.addressPVM)
      : undefined

  let xpAddresses: string[] = []
  if (queryData?.xpAddresses && queryData.xpAddresses.length > 0) {
    xpAddresses = queryData.xpAddresses.map(x => stripAddressPrefix(x.address))
  } else if (primaryAddress) {
    xpAddresses = [primaryAddress]
  }

  let xpAddressDictionary: XPAddressDictionary = {}
  if (
    queryData?.xpAddressDictionary &&
    Object.keys(queryData.xpAddressDictionary).length > 0
  ) {
    xpAddressDictionary = queryData.xpAddressDictionary
  }

  // CP-15095: the profile service only returns addresses with X/P activity, so
  // a never-used primary address is absent even when other addresses are
  // present. Every wallet type signs with the account's external index 0 for
  // addressPVM (mnemonic: SimpleSigner account node 0/0; Ledger: 0/0 under
  // m/44'/9000'/{accountIndex}' for both BIP44 and Ledger Live), so index 0 is
  // always correct here. Without this entry a UTXO owned by addressPVM (e.g. a
  // CCT import) gets no signing index. This covers CP-14507 (empty dictionary)
  // as well.
  if (primaryAddress && !(primaryAddress in xpAddressDictionary)) {
    xpAddressDictionary = {
      ...xpAddressDictionary,
      [primaryAddress]: {
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
