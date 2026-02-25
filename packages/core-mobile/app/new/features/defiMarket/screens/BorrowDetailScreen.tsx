import {
  Button,
  Card,
  ScrollView,
  Separator,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { transactionSnackbar } from 'common/utils/toast'
import { useDeposits } from 'hooks/earn/useDeposits'
import { useSimpleFadingHeader } from 'common/hooks/useSimpleFadingHeader'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BorrowAssetRow } from '../components/BorrowAssetRow'
import { useAaveBorrowPositionsSummary } from '../hooks/aave/useAaveBorrowPositionsSummary'
import { useBenqiBorrowPositionsSummary } from '../hooks/benqi/useBenqiBorrowPositionsSummary'
import { BorrowPosition } from '../types'

export function BorrowDetailScreen(): JSX.Element {
  const { marketId } = useLocalSearchParams<{ marketId: string }>()
  const { bottom } = useSafeAreaInsets()
  const { deposits } = useDeposits()
  const { theme } = useTheme()

  const { onScroll, animatedHeaderStyle, handleHeaderLayout } =
    useSimpleFadingHeader({
      title: 'Borrow details',
      shouldHeaderHaveGrabber: false
    })

  const { positions: aavePositions, isLoading: isLoadingAave } =
    useAaveBorrowPositionsSummary()
  const { positions: benqiPositions, isLoading: isLoadingBenqi } =
    useBenqiBorrowPositionsSummary()

  const borrowPosition = useMemo((): BorrowPosition | undefined => {
    const allPositions = [...aavePositions, ...benqiPositions]
    return allPositions.find(p => p.market.uniqueMarketId === marketId)
  }, [aavePositions, benqiPositions, marketId])

  const collateralDeposits = useMemo(() => {
    if (!borrowPosition) return []
    return deposits.filter(
      d =>
        d.marketName === borrowPosition.market.marketName &&
        d.usageAsCollateralEnabledOnUser === true
    )
  }, [deposits, borrowPosition])

  const totalCollateralUsd = useMemo(() => {
    return collateralDeposits.reduce((sum, d) => {
      return sum + d.asset.mintTokenBalance.balanceValue.value.toNumber()
    }, 0)
  }, [collateralDeposits])

  const netApyPercent = useMemo(() => {
    if (!borrowPosition || totalCollateralUsd === 0) return undefined

    const { borrowedAmountUsd, market } = borrowPosition
    const netWorthUsd = totalCollateralUsd - borrowedAmountUsd

    if (netWorthUsd <= 0) return undefined

    // Weighted collateral earnings
    const collateralEarnings = collateralDeposits.reduce((sum, d) => {
      const depositValue =
        d.asset.mintTokenBalance.balanceValue.value.toNumber()
      return sum + (d.supplyApyPercent / 100) * depositValue
    }, 0)

    // Borrow cost
    const borrowCost = (market.borrowApyPercent / 100) * borrowedAmountUsd

    // Net APY = (Collateral Earnings - Borrow Cost) / Net Worth * 100
    return ((collateralEarnings - borrowCost) / netWorthUsd) * 100
  }, [borrowPosition, collateralDeposits, totalCollateralUsd])

  const handleRepay = useCallback(() => {
    transactionSnackbar.plain({ message: 'Repay flow is coming soon' })
  }, [])

  const renderHeader = useCallback(() => {
    return (
      <View>
        <Animated.View
          onLayout={handleHeaderLayout}
          style={animatedHeaderStyle}>
          <Text variant="heading2">Borrow details</Text>
        </Animated.View>
      </View>
    )
  }, [handleHeaderLayout, animatedHeaderStyle])

  const renderBanner = useCallback(() => {
    if (!borrowPosition) return null

    const { market } = borrowPosition

    const collateralApyPercent =
      totalCollateralUsd > 0
        ? collateralDeposits.reduce((sum, d) => {
            const depositValue =
              d.asset.mintTokenBalance.balanceValue.value.toNumber()
            return sum + d.supplyApyPercent * depositValue
          }, 0) / totalCollateralUsd
        : undefined

    const data = [
      {
        value: `${market.borrowApyPercent.toFixed(2)}%`,
        label: 'Borrow APY'
      },
      {
        value:
          collateralApyPercent !== undefined
            ? `${collateralApyPercent.toFixed(2)}%`
            : '--',
        label: 'Collateral APY'
      },
      {
        value:
          netApyPercent !== undefined ? `${netApyPercent.toFixed(2)}%` : '--',
        label: 'Net APY'
      }
    ]

    return (
      <View
        sx={{
          marginTop: 25,
          padding: 16,
          backgroundColor: '$surfaceSecondary',
          borderRadius: 18
        }}>
        <View
          sx={{
            flexDirection: 'row',
            gap: 12
          }}>
          {data.map((item, index) => (
            <View key={index} sx={{ flex: 1 }}>
              <Text variant="heading5" sx={{ color: '$textPrimary' }}>
                {item.value}
              </Text>
              <Text variant="caption" sx={{ color: '$textSecondary' }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    )
  }, [borrowPosition, collateralDeposits, netApyPercent, totalCollateralUsd])

  const renderContent = useCallback(() => {
    if (!borrowPosition) return <LoadingState sx={{ flex: 1 }} />

    const { market, borrowedAmount, borrowedAmountUsd } = borrowPosition

    return (
      <View sx={{ marginTop: 12, gap: 12 }}>
        <Card
          sx={{
            alignItems: 'stretch',
            padding: 0
          }}>
          <BorrowAssetRow
            asset={market.asset}
            network={market.network}
            label="Borrowed"
            amount={borrowedAmount}
            amountUsd={borrowedAmountUsd}
          />
        </Card>

        {collateralDeposits.length > 0 && (
          <Card
            sx={{
              alignItems: 'stretch',
              padding: 0
            }}>
            {collateralDeposits.map((deposit, index) => {
              const depositAmount =
                Number(deposit.asset.mintTokenBalance.balance) /
                10 ** deposit.asset.decimals
              const depositAmountUsd =
                deposit.asset.mintTokenBalance.balanceValue.value.toNumber()

              return (
                <React.Fragment key={deposit.uniqueMarketId}>
                  {index > 0 && <Separator sx={{ marginHorizontal: 16 }} />}
                  <BorrowAssetRow
                    asset={deposit.asset}
                    network={deposit.network}
                    label="Collateral"
                    labelColor={theme.colors.$textSecondary}
                    amount={depositAmount}
                    amountUsd={depositAmountUsd}
                  />
                </React.Fragment>
              )
            })}
          </Card>
        )}
      </View>
    )
  }, [borrowPosition, collateralDeposits, theme.colors.$textSecondary])

  const renderFooter = useCallback(() => {
    if (!borrowPosition) return null

    return (
      <View sx={{ marginBottom: bottom, padding: 16 }}>
        <Button type="primary" size="large" onPress={handleRepay}>
          Repay
        </Button>
      </View>
    )
  }, [borrowPosition, handleRepay, bottom])

  if (isLoadingAave || isLoadingBenqi) {
    return (
      <BlurredBarsContentLayout>
        <LoadingState sx={{ flex: 1 }} />
      </BlurredBarsContentLayout>
    )
  }

  return (
    <BlurredBarsContentLayout>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerSx={{ padding: 16 }}>
        {renderHeader()}
        {renderBanner()}
        {renderContent()}
      </ScrollView>
      {renderFooter()}
    </BlurredBarsContentLayout>
  )
}
