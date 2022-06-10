import { useMemo } from 'react'
import { ChainId } from '@avalabs/chains-sdk'
import { BN } from 'bn.js'
import { useTokens } from 'hooks/useTokens'
import { TokenWithBalance } from 'store/balance'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { useActiveNetwork } from 'hooks/useActiveNetwork'

const bnZero = new BN(0)

export function useTokensWithBalances(
  forceShowTokensWithoutBalances?: boolean,
  chainId?: number
) {
  const tokens = useTokens()
  const activeAccount = useActiveAccount()
  const network = useActiveNetwork()

  const selectedChainId = chainId ? chainId : network?.chainId

  return useMemo<TokenWithBalance[]>(() => {
    if (!selectedChainId || !activeAccount) {
      return []
    }

    const address =
      selectedChainId === ChainId.BITCOIN ||
      selectedChainId === ChainId.BITCOIN_TESTNET
        ? activeAccount.addressBtc
        : activeAccount.address
    if (forceShowTokensWithoutBalances || showTokensWithoutBalances) {
      return tokens. || []
    }

    return (
      tokens.balances?.[selectedChainId]?.[address]?.filter(token =>
        token.balance.gt(bnZero)
      ) || []
    )
  }, [
    activeAccount,
    tokens,
    selectedChainId,
    forceShowTokensWithoutBalances,
    showTokensWithoutBalances
  ])
}
