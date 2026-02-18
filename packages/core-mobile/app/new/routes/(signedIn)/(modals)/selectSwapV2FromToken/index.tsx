import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { SelectSwapV2TokenScreen } from 'features/swapV2/screens/SelectSwapV2TokenScreen'
import { useSwapSelectedFromToken } from 'features/swapV2/hooks/useZustandStore'
import { useSupportedChains } from 'features/swapV2/hooks/useSupportedChains'

const SelectSwapV2FromTokenScreen = (): JSX.Element => {
  const [selectedFromToken, setSelectedFromToken] = useSwapSelectedFromToken()
  const { networkChainId } = useLocalSearchParams<{ networkChainId?: string }>()

  // Get all source chains (no filtering for FROM selection)
  const { chains } = useSupportedChains()

  return (
    <SelectSwapV2TokenScreen
      selectedToken={selectedFromToken}
      setSelectedToken={setSelectedFromToken}
      hideZeroBalance={true}
      // Pre-select network to match "to" token's network
      defaultNetworkChainId={
        networkChainId ? parseInt(networkChainId, 10) : undefined
      }
      // Pass all source chains
      networks={chains}
    />
  )
}

export default SelectSwapV2FromTokenScreen
