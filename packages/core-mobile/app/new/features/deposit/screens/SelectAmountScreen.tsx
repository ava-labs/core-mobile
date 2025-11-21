import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { TokenType } from '@avalabs/vm-module-types'
import { useDepositSelectedMarket, useDepositSelectedAsset } from '../store'
import { MarketNames } from '../types'
import { AaveErc20SelectAmountForm } from '../components/AaveErc20SelectAmountForm'
import { AaveAvaxSelectAmountForm } from '../components/AaveAvaxSelectAmountForm'
import { BenqiErc20SelectAmountForm } from '../components/BenqiErc20SelectAmountForm'
import { BenqiAvaxSelectAmountForm } from '../components/BenqiAvaxSelectAmountForm'

export const SelectAmountScreen = (): JSX.Element => {
  const { dismissAll, back } = useRouter()
  const [selectedAsset] = useDepositSelectedAsset()
  const [selectedMarket] = useDepositSelectedMarket()

  const handleSuccess = useCallback(() => {
    dismissAll()
    back()
  }, [dismissAll, back])

  return (
    <>
      {selectedAsset &&
        selectedMarket &&
        (selectedMarket.marketName === MarketNames.aave ? (
          selectedAsset.token.type === TokenType.NATIVE ? (
            <AaveAvaxSelectAmountForm
              asset={selectedAsset}
              market={selectedMarket}
              onSuccess={handleSuccess}
            />
          ) : (
            <AaveErc20SelectAmountForm
              asset={selectedAsset}
              market={selectedMarket}
              onSuccess={handleSuccess}
            />
          )
        ) : selectedMarket.marketName === MarketNames.benqi ? (
          selectedAsset.token.type === TokenType.NATIVE ? (
            <BenqiAvaxSelectAmountForm
              asset={selectedAsset}
              market={selectedMarket}
              onSuccess={handleSuccess}
            />
          ) : (
            <BenqiErc20SelectAmountForm
              asset={selectedAsset}
              market={selectedMarket}
              onSuccess={handleSuccess}
            />
          )
        ) : null)}
    </>
  )
}
