import React from 'react'
import { SelectSwapV2TokenScreen } from 'features/swapV2/screens/SelectSwapV2TokenScreen'
import { useSwapSelectedFromToken } from 'features/swapV2/hooks/useZustandStore'

const SelectSwapV2FromTokenScreen = (): JSX.Element => {
  const [selectedFromToken, setSelectedFromToken] = useSwapSelectedFromToken()

  return (
    <SelectSwapV2TokenScreen
      selectedToken={selectedFromToken}
      setSelectedToken={setSelectedFromToken}
      hideZeroBalance={true}
    />
  )
}

export default SelectSwapV2FromTokenScreen
