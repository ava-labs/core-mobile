import React from 'react'
import { SelectSwapTokenScreen } from 'features/swap/screens/SelectSwapTokenScreen'
import { useSwapSelectedToToken } from 'features/swap/store'

const SelectSwapToTokenScreen = (): JSX.Element => {
  const [selectedToToken, setSelectedToToken] = useSwapSelectedToToken()

  return (
    <SelectSwapTokenScreen
      selectedToken={selectedToToken}
      setSelectedToken={setSelectedToToken}
      hideZeroBalance={false}
    />
  )
}

export default SelectSwapToTokenScreen
