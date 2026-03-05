import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { findMatchingTokenWithBalance } from 'common/utils/findMatchingTokenWithBalance'

/**
 * Returns the active account's wallet balance for the given asset as a TokenUnit.
 * When chainId is provided, only that network's tokens are searched.
 */
export const useTokenBalance = (
  asset:
    | {
        symbol: string
        contractAddress?: string
        decimals: number
      }
    | undefined,
  chainId?: number
): TokenUnit | undefined => {
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useTokensWithBalanceForAccount({
    account: activeAccount,
    chainId
  })

  return useMemo(() => {
    if (!asset) return undefined

    const token = findMatchingTokenWithBalance(asset, tokens)

    if (token?.balance === undefined) return undefined

    return new TokenUnit(token.balance, asset.decimals, asset.symbol)
  }, [asset, tokens])
}
