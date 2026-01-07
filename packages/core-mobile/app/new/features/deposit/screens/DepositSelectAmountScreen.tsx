import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { TokenType } from '@avalabs/vm-module-types'
import { useDepositSelectedMarket, useDepositSelectedAsset } from '../store'
import { MarketNames } from '../types'
import { DepositAaveErc20SelectAmountForm } from '../components/DepositAaveErc20SelectAmountForm'
import { DepositAaveAvaxSelectAmountForm } from '../components/DepositAaveAvaxSelectAmountForm'
import { DepositBenqiErc20SelectAmountForm } from '../components/DepositBenqiErc20SelectAmountForm'
import { DepositBenqiAvaxSelectAmountForm } from '../components/DepositBenqiAvaxSelectAmountForm'

export const DepositSelectAmountScreen = (): JSX.Element => {
  const { dismissAll, back } = useRouter()
  const [selectedAsset] = useDepositSelectedAsset()
  const [selectedMarket] = useDepositSelectedMarket()

  const handleSuccess = useCallback(() => {
    dismissAll()
    back()
  }, [dismissAll, back])

  if (!selectedAsset || !selectedMarket) {
    return <></>
  }

  if (selectedMarket.marketName === MarketNames.aave) {
    return selectedAsset.token.type === TokenType.NATIVE ? (
      <DepositAaveAvaxSelectAmountForm
        asset={selectedAsset}
        market={selectedMarket}
        onSuccess={handleSuccess}
      />
    ) : (
      <DepositAaveErc20SelectAmountForm
        asset={selectedAsset}
        market={selectedMarket}
        onSuccess={handleSuccess}
      />
    )
  } else if (selectedMarket.marketName === MarketNames.benqi) {
    return selectedAsset.token.type === TokenType.NATIVE ? (
      <DepositBenqiAvaxSelectAmountForm
        asset={selectedAsset}
        market={selectedMarket}
        onSuccess={handleSuccess}
      />
    ) : (
      <DepositBenqiErc20SelectAmountForm
        asset={selectedAsset}
        market={selectedMarket}
        onSuccess={handleSuccess}
      />
    )
  }

  return <></>
}
