import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { DefiAssetDetails, DefiMarket } from '../types'
import { findMatchingTokenWithBalance } from '../utils/findMatchingTokenWithBalance'

export const useDepositableTokens = (
  markets: DefiMarket[],
  tokensWithBalance: LocalTokenWithBalance[]
): DefiAssetDetails[] => {
  return useMemo(() => {
    const uniqueAssets = new Map<string, DefiAssetDetails>()

    markets
      .filter(market => market.supplyCapReached === false)
      .forEach(market => {
        const asset = market.asset
        const key = asset.contractAddress ?? asset.symbol.toLowerCase()

        if (!uniqueAssets.has(key)) {
          uniqueAssets.set(key, asset)
        }
      })

    return Array.from(uniqueAssets.values()).sort((a, b) =>
      sortByPriority(a, b, tokensWithBalance)
    )
  }, [markets, tokensWithBalance])
}

const sortByPriority = (
  a: DefiAssetDetails,
  b: DefiAssetDetails,
  tokensWithBalance: LocalTokenWithBalance[]
): number => {
  // AVAX always comes first
  if (a.symbol.toLowerCase() === 'avax') return -1
  if (b.symbol.toLowerCase() === 'avax') return 1

  const tokenA = findMatchingTokenWithBalance(a, tokensWithBalance)
  const tokenB = findMatchingTokenWithBalance(b, tokensWithBalance)

  // Sort by fiat balance (descending)
  if (tokenA?.balanceInCurrency && tokenB?.balanceInCurrency) {
    return tokenB.balanceInCurrency - tokenA.balanceInCurrency
  }
  if (tokenA?.balanceInCurrency) return -1
  if (tokenB?.balanceInCurrency) return 1

  // Sort by token balance (descending)
  if (tokenA?.balance !== undefined && tokenB?.balance !== undefined) {
    if (tokenB.balance > tokenA.balance) return 1
    if (tokenB.balance < tokenA.balance) return -1
    return 0
  }
  if (tokenA?.balance !== undefined) return -1
  if (tokenB?.balance !== undefined) return 1

  // Sort alphabetically
  return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase())
}
