import React, { useCallback, useState } from 'react'
import {
  BorrowTabContent,
  BorrowContentState,
  BorrowTabScreenProps
} from '../components/borrow/BorrowTabContent'
import { AaveBorrowStateController } from '../components/borrow/AaveBorrowStateController'
import { BenqiBorrowStateController } from '../components/borrow/BenqiBorrowStateController'
import { useSelectedBorrowProtocol } from '../hooks/useBorrowProtocol'
import { MarketNames } from '../types'

const BorrowTabScreen = (props: BorrowTabScreenProps): JSX.Element => {
  const [selectedProtocol] = useSelectedBorrowProtocol()
  const [contentState, setContentState] = useState<BorrowContentState>()

  const handleStateChange = useCallback((nextState: BorrowContentState) => {
    setContentState(nextState)
  }, [])

  return (
    <>
      {selectedProtocol === MarketNames.aave ? (
        <AaveBorrowStateController onStateChange={handleStateChange} />
      ) : (
        <BenqiBorrowStateController onStateChange={handleStateChange} />
      )}
      {contentState && (
        <BorrowTabContent
          {...props}
          selectedProtocol={selectedProtocol}
          contentState={contentState}
        />
      )}
    </>
  )
}

export default BorrowTabScreen
