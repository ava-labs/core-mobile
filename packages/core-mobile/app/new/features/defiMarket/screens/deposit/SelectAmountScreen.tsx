import React, { useCallback, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { TokenType } from '@avalabs/vm-module-types'
import { useAvailableMarkets } from 'features/defiMarket/hooks/useAvailableMarkets'
import { useDepositSelectedAsset } from '../../store'
import { MarketNames } from '../../types'
import { AaveErc20SelectAmountForm } from '../../components/deposit/AaveErc20SelectAmountForm'
import { AaveAvaxSelectAmountForm } from '../../components/deposit/AaveAvaxSelectAmountForm'
import { BenqiErc20SelectAmountForm } from '../../components/deposit/BenqiErc20SelectAmountForm'
import { BenqiAvaxSelectAmountForm } from '../../components/deposit/BenqiAvaxSelectAmountForm'

export const SelectAmountScreen = (): JSX.Element => {
  const { dismissAll, back } = useRouter()
  const { marketId } = useLocalSearchParams<{ marketId: string }>()
  const { data: markets } = useAvailableMarkets()
  const selectedMarket = useMemo(() => {
    return markets?.find(market => market.uniqueMarketId === marketId)
  }, [markets, marketId])
  const [selectedAsset] = useDepositSelectedAsset()

  const handleSuccess = useCallback(() => {
    dismissAll()
    back()
  }, [dismissAll, back])

  if (!selectedAsset || !selectedMarket) {
    return <></>
  }

  if (selectedMarket.marketName === MarketNames.aave) {
    return selectedAsset.token.type === TokenType.NATIVE ? (
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
  } else if (selectedMarket.marketName === MarketNames.benqi) {
    return selectedAsset.token.type === TokenType.NATIVE ? (
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
  }

  return <></>
}
