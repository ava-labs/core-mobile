import React from 'react'
import { SelectSwapTokenScreen } from 'features/swap/screens/SelectSwapTokenScreen'
import { useSwapSelectedFromToken } from 'features/swap/store'

const SelectSwapFromTokenScreen = (): JSX.Element => {
  const [selectedFromToken, setSelectedFromToken] = useSwapSelectedFromToken()

  return (
    <SelectSwapTokenScreen
      selectedToken={selectedFromToken}
      setSelectedToken={setSelectedFromToken}
      hideZeroBalance={true}
    />
  )
}

export default SelectSwapFromTokenScreen
