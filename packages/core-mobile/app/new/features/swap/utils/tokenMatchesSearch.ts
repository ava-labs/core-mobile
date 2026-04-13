import { LocalTokenWithBalance } from 'store/balance'
import { isAddressLikeSearch } from 'common/utils/isAddressLikeSearch'

/**
 * Returns true if the token matches the search text.
 * Address-like queries match against localId; everything else matches name and symbol.
 */
export const tokenMatchesSearch = (
  token: LocalTokenWithBalance,
  searchText: string,
  isDeveloperMode: boolean
): boolean => {
  const q = searchText.trim().toLowerCase()
  if (q.length === 0) return true

  if (isAddressLikeSearch(searchText.trim(), isDeveloperMode)) {
    return token.localId.toLowerCase().includes(q)
  }

  return (
    token.name.toLowerCase().includes(q) ||
    token.symbol.toLowerCase().includes(q)
  )
}
