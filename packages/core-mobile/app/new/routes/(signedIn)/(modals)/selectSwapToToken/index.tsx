import React, { useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router'
import type { Network } from '@avalabs/core-chains-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { SelectSwapTokenScreen } from 'features/swap/screens/SelectSwapTokenScreen'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swap/hooks/useZustandStore'
import { useSupportedChains } from 'features/swap/hooks/useSupportedChains'
import { tokenIds } from 'consts/tokenIds'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { getTokenKey } from 'features/swap/utils/tokenKey'

const SelectSwapToTokenScreen = (): JSX.Element => {
  const [selectedToToken, setSelectedToToken] = useSwapSelectedToToken()
  const [selectedFromToken] = useSwapSelectedFromToken()
  const { networkChainId } = useLocalSearchParams<{ networkChainId?: string }>()

  // Get supported chains and filtered destinations
  const { allChains, destinations } = useSupportedChains(
    selectedFromToken?.networkChainId
  )

  // Use filtered destinations if FROM token selected, otherwise show all Fusion-supported chains
  const networks = selectedFromToken?.networkChainId ? destinations : allChains

  // When FROM is Bitcoin and browsing Avalanche as destination, only BTC.b is eligible
  const tokenFilter = useCallback(
    (token: LocalTokenWithBalance, selectedNetwork: Network | undefined) => {
      const tokenKey = getTokenKey(token)
      // Hide the currently selected TO token (no point re-selecting it)
      if (selectedToToken && tokenKey === getTokenKey(selectedToToken)) {
        return false
      }
      // Hide the FROM token to prevent selecting the same token on both sides
      if (selectedFromToken && tokenKey === getTokenKey(selectedFromToken)) {
        return false
      }
      if (
        selectedFromToken?.networkChainId &&
        isBitcoinChainId(selectedFromToken.networkChainId) &&
        selectedNetwork !== undefined &&
        isAvalancheCChainId(selectedNetwork.chainId)
      ) {
        return token.internalId === tokenIds.BTC_B
      }
      return true
    },
    [selectedFromToken, selectedToToken]
  )

  return (
    <SelectSwapTokenScreen
      selectedToken={selectedToToken}
      setSelectedToken={setSelectedToToken}
      // Pre-select network to match "from" token's network
      defaultNetworkChainId={
        networkChainId ? parseInt(networkChainId, 10) : undefined
      }
      // Pass filtered networks
      networks={networks}
      tokenFilter={tokenFilter}
      // Show tokens for all Fusion-supported networks, not just enabled ones
      filterByEnabledChains={false}
    />
  )
}

export default SelectSwapToTokenScreen
