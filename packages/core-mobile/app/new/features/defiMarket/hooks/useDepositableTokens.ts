import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { DefiAssetDetails, DefiMarket } from '../types'
import { findMatchingTokenWithBalance } from '../utils/findMatchingTokenWithBalance'

export const useDepositableTokens = (
  markets: DefiMarket[],
  tokensWithBalance: LocalTokenWithBalance[]
): DefiAssetDetails[] => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return useMemo(() => {
    const uniqueAssets = new Map<string, DefiAssetDetails>()

    markets
      .filter(market => market.supplyCapReached === false)
      .forEach(market => {
        const asset = market.asset
        // Use contractAddress if available, otherwise use lowercase symbol
        const key = asset.contractAddress ?? asset.symbol.toLowerCase()

        // Only add if not already in map (keeps first occurrence)
        if (!uniqueAssets.has(key)) {
          uniqueAssets.set(key, asset)
        }
      })

    return Array.from(uniqueAssets.values()).sort((a, b) => {
      if (a.symbol.toLowerCase() === 'avax') return -1
      if (b.symbol.toLowerCase() === 'avax') return 1

      const tokenWithBalanceA = findMatchingTokenWithBalance(
        a,
        tokensWithBalance
      )
      const tokenWithBalanceB = findMatchingTokenWithBalance(
        b,
        tokensWithBalance
      )

      if (
        tokenWithBalanceA?.balanceInCurrency &&
        tokenWithBalanceB?.balanceInCurrency
      ) {
        return (
          tokenWithBalanceB.balanceInCurrency -
          tokenWithBalanceA.balanceInCurrency
        )
      }
      if (tokenWithBalanceA?.balanceInCurrency) return -1
      if (tokenWithBalanceB?.balanceInCurrency) return 1

      if (
        tokenWithBalanceA?.balance !== undefined &&
        tokenWithBalanceB?.balance !== undefined
      ) {
        // Compare bigint values without arithmetic to avoid type issues
        if (tokenWithBalanceB.balance > tokenWithBalanceA.balance) return 1
        if (tokenWithBalanceB.balance < tokenWithBalanceA.balance) return -1
        return 0
      }
      if (tokenWithBalanceA?.balance !== undefined) return -1
      if (tokenWithBalanceB?.balance !== undefined) return 1

      return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase())
    })
  }, [markets, tokensWithBalance])
}
