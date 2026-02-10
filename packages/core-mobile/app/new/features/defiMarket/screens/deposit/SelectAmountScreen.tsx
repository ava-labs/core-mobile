import React, { useCallback, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { TokenType } from '@avalabs/vm-module-types'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useAvailableMarkets } from 'features/defiMarket/hooks/useAvailableMarkets'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  useDepositSelectedAsset,
  useRedirectToBorrowAfterDeposit
} from '../../store'
import { MarketNames } from '../../types'
import { AaveErc20SelectAmountForm } from '../../components/deposit/AaveErc20SelectAmountForm'
import { AaveAvaxSelectAmountForm } from '../../components/deposit/AaveAvaxSelectAmountForm'
import { BenqiErc20SelectAmountForm } from '../../components/deposit/BenqiErc20SelectAmountForm'
import { BenqiAvaxSelectAmountForm } from '../../components/deposit/BenqiAvaxSelectAmountForm'

export const SelectAmountScreen = (): JSX.Element => {
  const { dismissAll, back, navigate } = useRouter()
  const { marketId } = useLocalSearchParams<{ marketId: string }>()
  const { data: markets } = useAvailableMarkets()
  const activeAccount = useSelector(selectActiveAccount)
  const selectedMarket = useMemo(() => {
    return markets?.find(market => market.uniqueMarketId === marketId)
  }, [markets, marketId])
  const [selectedAsset] = useDepositSelectedAsset()
  const [redirectToBorrow, setRedirectToBorrow] =
    useRedirectToBorrowAfterDeposit()

  // Called when transaction is submitted (modal closes)
  const handleSubmitted = useCallback(
    ({ txHash, amount }: { txHash: string; amount: TokenUnit }) => {
      AnalyticsService.capture('EarnDepositSubmitted', {
        token: selectedAsset?.token.symbol ?? '',
        quantity: amount.toDisplay(),
        protocol: selectedMarket?.marketName ?? '',
        txHash,
        address: activeAccount?.addressC ?? ''
      })
      dismissAll()
      back()
    },
    [selectedAsset, selectedMarket, activeAccount, dismissAll, back]
  )

  // Called when transaction is confirmed on-chain
  const handleConfirmed = useCallback(() => {
    AnalyticsService.capture('EarnDepositSuccess')
    if (redirectToBorrow) {
      setRedirectToBorrow(false)
      // @ts-ignore TODO: make routes typesafe
      navigate('/borrow/onboarding')
    }
  }, [redirectToBorrow, setRedirectToBorrow, navigate])

  // Called when transaction is reverted or fails
  const handleError = useCallback(() => {
    AnalyticsService.capture('EarnDepositFailure')
  }, [])

  if (!selectedAsset || !selectedMarket) {
    return <></>
  }

  if (selectedMarket.marketName === MarketNames.aave) {
    return selectedAsset.token.type === TokenType.NATIVE ? (
      <AaveAvaxSelectAmountForm
        asset={selectedAsset}
        market={selectedMarket}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleError}
        onError={handleError}
      />
    ) : (
      <AaveErc20SelectAmountForm
        asset={selectedAsset}
        market={selectedMarket}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleError}
        onError={handleError}
      />
    )
  } else if (selectedMarket.marketName === MarketNames.benqi) {
    return selectedAsset.token.type === TokenType.NATIVE ? (
      <BenqiAvaxSelectAmountForm
        asset={selectedAsset}
        market={selectedMarket}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleError}
        onError={handleError}
      />
    ) : (
      <BenqiErc20SelectAmountForm
        asset={selectedAsset}
        market={selectedMarket}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleError}
        onError={handleError}
      />
    )
  }

  return <></>
}
