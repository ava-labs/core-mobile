import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { findMatchingTokenWithBalance } from 'common/utils/findMatchingTokenWithBalance'
import { DefiAssetDetails } from '../types'

/**
 * Wallet balance of the underlying asset for DeFi **repay** flows (Aave/Benqi).
 * Not a general-purpose balance hook — returns `0n` when the token is missing from
 * the portfolio so repay UIs can always validate against a concrete `TokenUnit`.
 *
 * Returns `undefined` only when `asset` is `undefined` (e.g. position not loaded).
 * When `chainId` is set, only that network's tokens are searched.
 */
export function useRepayTokenBalance(
  asset: DefiAssetDetails | undefined,
  chainId?: number
): TokenUnit | undefined {
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useTokensWithBalanceForAccount({
    account: activeAccount,
    chainId
  })

  return useMemo(() => {
    if (!asset) return undefined

    const token = findMatchingTokenWithBalance(asset, tokens)

    return new TokenUnit(token?.balance ?? 0n, asset.decimals, asset.symbol)
  }, [asset, tokens])
}
