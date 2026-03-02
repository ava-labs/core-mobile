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
import { ErrorState } from 'common/components/ErrorState'
import React, { useCallback, useMemo } from 'react'
import { formatUnits } from 'viem'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { transactionSnackbar } from 'common/utils/toast'
import { useDeposits } from 'hooks/earn/useDeposits'
import { useSimpleFadingHeader } from 'common/hooks/useSimpleFadingHeader'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BorrowAssetRow } from '../BorrowAssetRow'
import { BorrowPosition, MarketName } from '../../types'
import { calculateNetApy } from '../../utils/calculateNetApy'

interface BorrowDetailContentProps {
  borrowPosition: BorrowPosition | undefined
  isLoading: boolean
  protocol: MarketName
}

export function BorrowDetailContent({
  borrowPosition,
  isLoading,
  protocol
}: BorrowDetailContentProps): JSX.Element {
  const { bottom } = useSafeAreaInsets()
  const { deposits } = useDeposits()
  const { theme } = useTheme()

  const { onScroll, animatedHeaderStyle, handleHeaderLayout } =
    useSimpleFadingHeader({
      title: 'Borrow details',
      shouldHeaderHaveGrabber: false
    })

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

    const depositItems = collateralDeposits.map(d => ({
      valueUsd: d.asset.mintTokenBalance.balanceValue.value.toNumber(),
      apyPercent: d.supplyApyPercent
    }))

    const borrowItems = [
      {
        valueUsd: borrowPosition.borrowedAmountUsd,
        apyPercent: borrowPosition.market.borrowApyPercent
      }
    ]

    return calculateNetApy({
      deposits: depositItems,
      borrows: borrowItems,
      protocol
    })
  }, [borrowPosition, collateralDeposits, totalCollateralUsd, protocol])

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

  const renderBanner = useCallback(
    (position: BorrowPosition) => {
      const { market } = position

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
    },
    [collateralDeposits, netApyPercent, totalCollateralUsd]
  )

  const renderContent = useCallback(
    (position: BorrowPosition) => {
      const { market, borrowedAmount, borrowedAmountUsd } = position

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
                const depositAmount = Number(
                  formatUnits(
                    deposit.asset.mintTokenBalance.balance,
                    deposit.asset.decimals
                  )
                )
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
    },
    [collateralDeposits, theme.colors.$textSecondary]
  )

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ marginBottom: bottom, padding: 16 }}>
        <Button type="primary" size="large" onPress={handleRepay}>
          Repay
        </Button>
      </View>
    )
  }, [handleRepay, bottom])

  if (isLoading) {
    return (
      <BlurredBarsContentLayout>
        <LoadingState sx={{ flex: 1 }} />
      </BlurredBarsContentLayout>
    )
  }

  if (!borrowPosition) {
    return (
      <BlurredBarsContentLayout>
        <ErrorState
          sx={{ flex: 1 }}
          title="Position not found"
          description="Unable to load borrow position details"
        />
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
        {renderBanner(borrowPosition)}
        {renderContent(borrowPosition)}
      </ScrollView>
      {renderFooter()}
    </BlurredBarsContentLayout>
  )
}
