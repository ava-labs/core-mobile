import { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { findMatchingTokenWithBalance } from '../utils/findMatchingTokenWithBalance'
import { DefiAssetDetails } from '../types'

/**
 * Returns the user's wallet balance for the given asset (underlying token).
 * Used for repay flow to know how much the user can afford to repay.
 */
export const useWalletBalanceForRepay = (
  asset: DefiAssetDetails | undefined
): TokenUnit | undefined => {
  const activeAccount = useSelector(selectActiveAccount)
  const { data: balances } = useAccountBalances(activeAccount)
  const cChainNetwork = useCChainNetwork()

  return useMemo(() => {
    if (!asset || !cChainNetwork) return undefined

    const cChainBalance = balances.find(
      b => b.chainId === cChainNetwork.chainId
    )
    if (!cChainBalance?.tokens) return undefined

    const token = findMatchingTokenWithBalance(
      {
        symbol: asset.symbol,
        contractAddress: asset.contractAddress
      },
      cChainBalance.tokens
    )

    if (!token?.balance) return undefined

    return new TokenUnit(
      typeof token.balance === 'bigint' ? token.balance : BigInt(token.balance),
      asset.decimals,
      asset.symbol
    )
  }, [asset, balances, cChainNetwork])
}
