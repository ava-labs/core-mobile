import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { SelectSwapV2TokenScreen } from 'features/swapV2/screens/SelectSwapV2TokenScreen'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swapV2/hooks/useZustandStore'
import { useSupportedChains } from 'features/swapV2/hooks/useSupportedChains'

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
    />
  )
}

export default SelectSwapV2ToTokenScreen
