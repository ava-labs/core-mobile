import React, { useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Network } from '@avalabs/core-chains-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { SelectSwapV2TokenScreen } from 'features/swapV2/screens/SelectSwapV2TokenScreen'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swapV2/hooks/useZustandStore'
import { useSupportedChains } from 'features/swapV2/hooks/useSupportedChains'
import { TOKEN_IDS } from 'features/swapV2/consts'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'

const SelectSwapV2ToTokenScreen = (): JSX.Element => {
  const [selectedToToken, setSelectedToToken] = useSwapSelectedToToken()
  const [selectedFromToken] = useSwapSelectedFromToken()
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
      if (
        selectedFromToken?.networkChainId &&
        isBitcoinChainId(selectedFromToken.networkChainId) &&
        selectedNetwork !== undefined &&
        isAvalancheCChainId(selectedNetwork.chainId)
      ) {
        return token.internalId === TOKEN_IDS.BTC_B
      }
      return true
    },
    [selectedFromToken?.networkChainId]
  )

  return (
    <SelectSwapV2TokenScreen
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

export default SelectSwapV2ToTokenScreen
