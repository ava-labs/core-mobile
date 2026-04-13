import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { LocalTokenWithBalance } from 'store/balance'
import { isTokenVisible } from 'store/balance/utils'
import { selectTokenVisibility } from 'store/portfolio'

export const useFilteredSwapTokens = ({
  tokens,
  hideZeroBalance
}: {
  tokens: LocalTokenWithBalance[]
  hideZeroBalance: boolean
}): LocalTokenWithBalance[] => {
  const tokenVisibility = useSelector(selectTokenVisibility)

  return useMemo(() => {
    let filteredTokens = tokens

    // Filter out blacklisted tokens
    filteredTokens = filteredTokens.filter(token =>
      isTokenVisible(tokenVisibility, token)
    )

    // Filter by balance if hideZeroBalance is true
    if (hideZeroBalance) {
      filteredTokens = filteredTokens.filter(token => token.balance > 0n)
    }

    // Sort by balance in currency (highest first)
    return [...filteredTokens].sort(
      (a, b) => (b.balanceInCurrency ?? 0) - (a.balanceInCurrency ?? 0)
    )
  }, [tokens, hideZeroBalance, tokenVisibility])
}
