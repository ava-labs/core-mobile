import React from 'react'
import { MarketNames } from '../../types'
import { useSelectedBorrowProtocol } from '../../hooks/useBorrowProtocol'
import { AaveSelectCollateralContent } from '../../components/borrow/AaveSelectCollateralContent'
import { BenqiSelectCollateralContent } from '../../components/borrow/BenqiSelectCollateralContent'

export const SelectCollateralScreen = (): JSX.Element => {
  const [selectedProtocol] = useSelectedBorrowProtocol()

  if (selectedProtocol === MarketNames.aave) {
    return <AaveSelectCollateralContent />
  }
  if (selectedProtocol === MarketNames.benqi) {
    return <BenqiSelectCollateralContent />
  }
  return <></>
}
