import React, { useCallback, useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import type { Network } from '@avalabs/core-chains-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { SelectSwapTokenScreen } from 'features/swap/screens/SelectSwapTokenScreen'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swap/hooks/useZustandStore'
import { useSupportedChains } from 'features/swap/hooks/useSupportedChains'
import { tokenIds } from 'consts/tokenIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'

const SelectSwapFromTokenScreen = (): JSX.Element => {
  const [selectedFromToken, setSelectedFromToken] = useSwapSelectedFromToken()
  const [selectedToToken] = useSwapSelectedToToken()
  const { networkChainId } = useLocalSearchParams<{ networkChainId?: string }>()
  const activeAccount = useSelector(selectActiveAccount)

  // Get all source chains (no filtering for FROM selection)
  const { chains } = useSupportedChains()

  // Get balance data to filter out networks with no tokens
  const { data: balances } = useAccountBalances(activeAccount)

  // Build set of chainIds that have at least one token with balance > 0
  const chainIdsWithBalance = useMemo(() => {
    return new Set(
      balances
        .filter(b => b.tokens.some(t => t.balance > 0n))
        .map(b => b.chainId)
    )
  }, [balances])

  // Filter out networks with no tokens with balance > 0, but only once balance
  // data has loaded for at least one network (avoids filtering before data arrives)
  const networksWithTokens = useMemo(() => {
    if (!chains) return chains
    if (balances.length === 0) return chains
    return chains.filter(n => chainIdsWithBalance.has(n.chainId))
  }, [chains, balances.length, chainIdsWithBalance])

  // When TO is Bitcoin and browsing Avalanche as source, only BTC.b is eligible
  const tokenFilter = useCallback(
    (token: LocalTokenWithBalance, selectedNetwork: Network | undefined) => {
      if (
        selectedToToken?.networkChainId &&
        isBitcoinChainId(selectedToToken.networkChainId) &&
        selectedNetwork !== undefined &&
        isAvalancheCChainId(selectedNetwork.chainId)
      ) {
        return token.internalId === tokenIds.BTC_B
      }
      return true
    },
    [selectedToToken?.networkChainId]
  )

  return (
    <SelectSwapTokenScreen
      selectedToken={selectedFromToken}
      setSelectedToken={setSelectedFromToken}
      hideZeroBalance={true}
      // Pre-select network to match "to" token's network
      defaultNetworkChainId={
        networkChainId ? parseInt(networkChainId, 10) : undefined
      }
      // Pass only networks that have tokens with balance > 0
      networks={networksWithTokens}
      tokenFilter={tokenFilter}
    />
  )
}

export default SelectSwapFromTokenScreen
