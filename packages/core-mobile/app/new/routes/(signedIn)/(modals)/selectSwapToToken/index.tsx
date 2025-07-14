import { SelectSwapTokenScreen } from 'features/swap/screens/SelectSwapTokenScreen'
import { useSwapSelectedToToken } from 'features/swap/store'
import React from 'react'
import { useSwapList } from 'common/hooks/useSwapList'
import { useLocalSearchParams } from 'expo-router'

const SelectSwapToTokenScreen = (): JSX.Element => {
  const [selectedToToken, setSelectedToToken] = useSwapSelectedToToken()
  const swapList = useSwapList()
  const { networkChainId } = useLocalSearchParams<{ networkChainId?: string }>()

  return (
    <SelectSwapTokenScreen
      tokens={swapList}
      selectedToken={selectedToToken}
      setSelectedToken={setSelectedToToken}
      networkChainId={networkChainId ? parseInt(networkChainId) : undefined}
    />
  )
}

export default SelectSwapToTokenScreen
