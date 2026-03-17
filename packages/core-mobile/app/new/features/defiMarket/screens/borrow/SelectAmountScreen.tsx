import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { useAvailableMarkets } from '../../hooks/useAvailableMarkets'
import { MarketNames } from '../../types'
import { BorrowAaveSelectAmountForm } from '../../components/borrow/AaveSelectAmountForm'
import { BorrowBenqiSelectAmountForm } from '../../components/borrow/BenqiSelectAmountForm'

export const SelectAmountScreen = (): JSX.Element => {
  const { uniqueMarketId } = useLocalSearchParams<{ uniqueMarketId: string }>()
  const { data: markets } = useAvailableMarkets()
  const activeAccount = useSelector(selectActiveAccount)
  const navigation = useNavigation()
  const market = useMemo(() => {
    return markets?.find(item => item.uniqueMarketId === uniqueMarketId)
  }, [markets, uniqueMarketId])
  const { dismissAll } = useRouter()

  const handleSubmitted = useCallback(
    ({ txHash, amount }: { txHash: string; amount: TokenUnit }) => {
      AnalyticsService.capture('EarnBorrowSubmitted', {
        token: market?.asset.symbol ?? '',
        quantity: amount.toDisplay(),
        protocol: market?.marketName ?? '',
        txHash,
        address: activeAccount?.addressC ?? ''
      })
      // Dismiss the entire borrow modal
      if (navigation.getParent()?.canGoBack()) {
        navigation.getParent()?.goBack()
      } else {
        dismissAll()
      }
    },
    [market, activeAccount, navigation, dismissAll]
  )

  // Called when transaction is confirmed on-chain
  const handleConfirmed = useCallback(() => {
    AnalyticsService.capture('EarnBorrowSuccess')
  }, [])

  // Called when transaction is reverted or fails
  const handleError = useCallback(() => {
    AnalyticsService.capture('EarnBorrowFailure')
  }, [])

  if (!market) {
    return <LoadingState sx={{ flex: 1 }} />
  }

  if (market.marketName === MarketNames.aave) {
    return (
      <BorrowAaveSelectAmountForm
        market={market}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleError}
        onError={handleError}
      />
    )
  }

  if (market.marketName === MarketNames.benqi) {
    return (
      <BorrowBenqiSelectAmountForm
        market={market}
        onSubmitted={handleSubmitted}
        onConfirmed={handleConfirmed}
        onReverted={handleError}
        onError={handleError}
      />
    )
  }

  return <ErrorState sx={{ flex: 1 }} />
}
