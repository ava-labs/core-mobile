import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useLocalSearchParams } from 'expo-router'
import type { Network } from '@avalabs/core-chains-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { SelectToSwapTokenScreen } from 'features/swap/screens/SelectToSwapTokenScreen'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swap/hooks/useZustandStore'
import { useSupportedChains } from 'features/swap/hooks/useSupportedChains'
import { tokenIds } from 'consts/tokenIds'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const SelectSwapToTokenScreen = (): JSX.Element => {
  const [selectedToToken, setSelectedToToken] = useSwapSelectedToToken()
  const [selectedFromToken] = useSwapSelectedFromToken()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const btcBTokenId = isDeveloperMode ? tokenIds.BTC_B_FUJI : tokenIds.BTC_B
  const { networkChainId } = useLocalSearchParams<{ networkChainId?: string }>()

  // Get supported chains and filtered destinations
  const { chains, destinations } = useSupportedChains(
    selectedFromToken?.networkChainId
  )

  // Use filtered destinations if FROM token selected, otherwise show all source chains
  const networks = selectedFromToken?.networkChainId ? destinations : chains

  // When FROM is Bitcoin and browsing Avalanche as destination, only BTC.b is eligible
  const tokenFilter = useCallback(
    (token: LocalTokenWithBalance, selectedNetwork: Network | undefined) => {
      // Hide the FROM token to prevent selecting the same token on both sides
      if (
        selectedFromToken &&
        token.localId === selectedFromToken.localId &&
        token.networkChainId === selectedFromToken.networkChainId
      ) {
        return false
      }
      if (
        selectedFromToken?.networkChainId &&
        isBitcoinChainId(selectedFromToken.networkChainId) &&
        selectedNetwork !== undefined &&
        isAvalancheCChainId(selectedNetwork.chainId)
      ) {
        return token.internalId === btcBTokenId
      }
      return true
    },
    [selectedFromToken, btcBTokenId]
  )

  return (
    <SelectToSwapTokenScreen
      selectedToken={selectedToToken}
      setSelectedToken={setSelectedToToken}
      // Pre-select network to match "from" token's network
      defaultNetworkChainId={
        networkChainId ? parseInt(networkChainId, 10) : undefined
      }
      // Pass filtered networks
      networks={networks}
      tokenFilter={tokenFilter}
    />
  )
}

export default SelectSwapToTokenScreen
