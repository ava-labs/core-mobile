import { isValidAddress } from 'features/accountSettings/utils/isValidAddress'

/**
 * Returns true if the search text looks like a valid address (EVM, Solana, Bitcoin, Avalanche X/P).
 * Use this to decide when to include localId in token search - only when the user is likely
 * pasting an address, not when typing a token name like "pump".
 */
export const isAddressLikeSearch = (
  searchText: string,
  isDeveloperMode: boolean
): boolean => {
  const trimmed = searchText.trim()
  if (!trimmed) return false

  return isValidAddress({
    address: trimmed,
    isDeveloperMode
  })
}
