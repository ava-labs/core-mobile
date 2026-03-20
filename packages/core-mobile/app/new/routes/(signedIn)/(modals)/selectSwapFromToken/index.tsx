import React, { useCallback } from 'react'
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

const SelectSwapFromTokenScreen = (): JSX.Element => {
  const [selectedFromToken, setSelectedFromToken] = useSwapSelectedFromToken()
  const [selectedToToken] = useSwapSelectedToToken()
  const { networkChainId } = useLocalSearchParams<{ networkChainId?: string }>()

  // Get all source chains (no filtering for FROM selection)
  const { chains } = useSupportedChains()

  // When TO is Bitcoin and browsing Avalanche as source, only BTC.b is eligible
  const tokenFilter = useCallback(
    (token: LocalTokenWithBalance, selectedNetwork: Network | undefined) => {
      // Hide the currently selected FROM token (no point re-selecting it)
      if (
        selectedFromToken &&
        token.internalId === selectedFromToken.internalId &&
        token.networkChainId === selectedFromToken.networkChainId
      ) {
        return false
      }
      // Hide the TO token to prevent selecting the same token on both sides
      if (
        selectedToToken &&
        token.internalId === selectedToToken.internalId &&
        token.networkChainId === selectedToToken.networkChainId
      ) {
        return false
      }
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
    [selectedFromToken, selectedToToken]
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
      // Pass all source chains
      networks={chains}
      tokenFilter={tokenFilter}
    />
  )
}

export default SelectSwapFromTokenScreen
