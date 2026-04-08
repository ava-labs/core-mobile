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

  // Get all supported swap source chains (filtered to networks with balance below)
  const { chains } = useSupportedChains()

  // Get balance data to filter out networks with no tokens
  const { data: balances, isLoading: isBalancesLoading } =
    useAccountBalances(activeAccount)

  // Build set of chainIds that have at least one token with balance > 0
  const chainIdsWithBalance = useMemo(() => {
    return new Set(
      balances
        .filter(b => b.tokens.some(t => t.balance > 0n))
        .map(b => b.chainId)
    )
  }, [balances])

  // Filter out networks with no tokens with balance > 0, but only once all
  // balance data has fully loaded (isBalancesLoading is false when every
  // enabled network has returned results). Filtering while still loading would
  // temporarily hide networks whose data hasn't arrived yet.
  // If all supported source networks have zero balance, fall back to all chains
  // so the token screen can render its empty state instead of staying in a
  // loading state.
  const networksWithTokens = useMemo(() => {
    if (!chains) return chains
    if (isBalancesLoading) return chains
    const filteredChains = chains.filter(n =>
      chainIdsWithBalance.has(n.chainId)
    )
    return filteredChains.length > 0 ? filteredChains : chains
  }, [chains, isBalancesLoading, chainIdsWithBalance])

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
