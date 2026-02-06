import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { SelectSwapV2TokenScreen } from 'features/swapV2/screens/SelectSwapV2TokenScreen'
import { useSwapSelectedToToken } from 'features/swapV2/store'

const SelectSwapV2ToTokenScreen = (): JSX.Element => {
  const [selectedToToken, setSelectedToToken] = useSwapSelectedToToken()
  const { networkChainId } = useLocalSearchParams<{ networkChainId?: string }>()

  return (
    <SelectSwapV2TokenScreen
      selectedToken={selectedToToken}
      setSelectedToken={setSelectedToToken}
      // Pre-select network to match "from" token's network
      defaultNetworkChainId={
        networkChainId ? parseInt(networkChainId, 10) : undefined
      }
    />
  )
}

export default SelectSwapV2ToTokenScreen
