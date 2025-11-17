import { useMemo } from 'react'
import { DefiAssetDetails, DefiMarket } from '../types'

export const useDepositableTokens = (
  markets: DefiMarket[]
): DefiAssetDetails[] => {
  return useMemo(() => {
    const uniqueAssets = new Map<string, DefiAssetDetails>()

    markets.forEach(market => {
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

      if (
        a.underlyingTokenBalance?.balanceInCurrency &&
        b.underlyingTokenBalance?.balanceInCurrency
      ) {
        return (
          b.underlyingTokenBalance.balanceInCurrency -
          a.underlyingTokenBalance.balanceInCurrency
        )
      }
      if (a.underlyingTokenBalance?.balanceInCurrency) return -1
      if (b.underlyingTokenBalance?.balanceInCurrency) return 1

      return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase())
    })
  }, [markets])
}
