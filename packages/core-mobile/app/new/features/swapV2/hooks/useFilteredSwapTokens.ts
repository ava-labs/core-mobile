import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { LocalTokenWithBalance } from 'store/balance'
import { isTokenVisible } from 'store/balance/utils'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isAddressLikeSearch } from 'common/utils/isAddressLikeSearch'

export const useFilteredSwapTokens = ({
  tokens,
  searchText,
  hideZeroBalance
}: {
  tokens: LocalTokenWithBalance[]
  searchText: string
  hideZeroBalance: boolean
}): LocalTokenWithBalance[] => {
  const tokenVisibility = useSelector(selectTokenVisibility)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useMemo(() => {
    let filteredTokens = tokens

    // Filter out blacklisted tokens
    filteredTokens = filteredTokens.filter(token =>
      isTokenVisible(tokenVisibility, token)
    )

    // Filter out tokens from disabled chains
    filteredTokens = filteredTokens.filter(token =>
      enabledChainIds.includes(token.networkChainId)
    )

    // Filter by balance if hideZeroBalance is true
    if (hideZeroBalance) {
      filteredTokens = filteredTokens.filter(token => token.balance > 0n)
    }

    // Filter by search text - only search localId when input looks like an address
    // (avoids Solana base58 false positives e.g. "pump" matching random addresses)
    if (searchText.trim().length > 0) {
      const query = searchText.toLowerCase().trim()
      const searchByAddress = isAddressLikeSearch(searchText, isDeveloperMode)
      filteredTokens = filteredTokens.filter(
        token =>
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query) ||
          (searchByAddress && token.localId.toLowerCase().includes(query))
      )
    }

    // Sort by balance in currency (highest first)
    return filteredTokens.sort(
      (a, b) => (b.balanceInCurrency ?? 0) - (a.balanceInCurrency ?? 0)
    )
  }, [
    tokens,
    searchText,
    hideZeroBalance,
    tokenVisibility,
    enabledChainIds,
    isDeveloperMode
  ])
}
