import {
  ActivityIndicator,
  alpha,
  Button,
  GroupList,
  GroupListItem,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { PerpsApiDownState } from '../components/PerpsApiDownState'
import { PerpsGeoRestrictionWarning } from '../components/PerpsGeoRestrictionWarning'
import { usePerpsAvailability } from '../hooks/usePerpsAvailability'
import { usePerpsPositions } from '../hooks/usePerpsPositions'
import { formatSigned, pnlColor } from '../utils/economics'
import { toNumber } from '../utils/format'

export const PerpetualsBalanceScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const router = useRouter()
  const { isGeoBlocked } = usePerpsAvailability()
  const {
    accountValueUsd,
    withdrawableUsd,
    mode,
    positions,
    clearinghouse,
    isLoading,
    isWithdrawableLoading,
    isWithdrawableUnavailable,
    isError: balanceError,
    refetch: refetchBalance
  } = usePerpsPositions()

  // An /info outage with no data to fall back on: the figures below would all
  // render as "$0", indistinguishable from an empty account. Show the API-down
  // state with a retry instead of a misleading zeroed-out balance.
  const balanceUnknown =
    (accountValueUsd === undefined && (balanceError || !isLoading)) ||
    (withdrawableUsd === undefined &&
      (isWithdrawableUnavailable || !isWithdrawableLoading))
  const balanceLoading =
    (accountValueUsd === undefined && isLoading) ||
    (withdrawableUsd === undefined && isWithdrawableLoading)
  const isPortfolioMargin = mode === 'portfolioMargin'

  const heroValue = accountValueUsd
  const withdrawable = withdrawableUsd
  const availableBalance = withdrawableUsd
  const openPositionsCount = positions.length

  // Total unrealized P&L across open positions (mark-to-market).
  const unrealizedPnl = useMemo(
    () =>
      positions.reduce((sum, p) => sum + toNumber(p.position.unrealizedPnl), 0),
    [positions]
  )
  // Maintenance margin Hyperliquid keeps locked to keep open positions solvent
  // (a per-coin fraction of notional, not a flat %). It's a subset of reserved
  // collateral, so it is surfaced within that row rather than added on top.
  const lockedMaintenanceMargin = toNumber(
    clearinghouse?.crossMaintenanceMarginUsed
  )
  // Reserved collateral = total equity − what can leave the account now. In
  // standard mode this tracks the perp ledger's committed margin; in unified /
  // portfolio-margin modes it also includes spot holds and maintenance limits.
  // Unrealized P&L is already reflected in equity and remains informational.
  // Guard the FP residue so it never shows "-$0".
  const reservedCollateral =
    heroValue !== undefined && withdrawable !== undefined
      ? Math.max(0, heroValue - withdrawable)
      : undefined

  useEffect(() => {
    AnalyticsService.capture('PerpetualsBalanceViewed')
  }, [])

  const handlePositionsPress = useCallback(() => {
    router.navigate('/perpetualsBalance/positions')
  }, [router])

  const withdrawableRows = useMemo<GroupListItem[]>(
    () =>
      withdrawable === undefined
        ? []
        : [
            {
              title: 'Withdrawable now',
              value: formatCurrency({ amount: withdrawable })
            }
          ],
    [formatCurrency, withdrawable]
  )

  const accountRows = useMemo<GroupListItem[]>(() => {
    if (availableBalance === undefined || reservedCollateral === undefined) {
      return []
    }
    const positionsLabel = `${openPositionsCount} position${
      openPositionsCount === 1 ? '' : 's'
    }`
    // Maintenance margin is held within reserved collateral.
    const collateralSubtitle =
      lockedMaintenanceMargin > 0
        ? `${positionsLabel} · ${formatCurrency({
            amount: lockedMaintenanceMargin
          })} maintenance margin`
        : positionsLabel

    return [
      {
        title: isPortfolioMargin ? 'Available USDC' : 'Available balance',
        value: formatCurrency({ amount: availableBalance })
      },
      {
        title: isPortfolioMargin
          ? 'Reserved USDC collateral'
          : 'Reserved collateral',
        subtitle: collateralSubtitle,
        value: formatCurrency({ amount: reservedCollateral }),
        accessory: (
          <Icons.Navigation.ChevronRight
            color={theme.colors.$textSecondary}
            style={{ marginRight: -8 }}
          />
        ),
        onPress: handlePositionsPress
      },
      {
        title: 'Unrealized P&L',
        value: (
          <Text
            variant="body1"
            sx={{
              color: pnlColor(
                unrealizedPnl,
                theme.colors,
                theme.colors.$textPrimary
              )
            }}>
            {formatSigned(unrealizedPnl, amount => formatCurrency({ amount }))}
          </Text>
        )
      }
    ]
  }, [
    formatCurrency,
    availableBalance,
    reservedCollateral,
    unrealizedPnl,
    openPositionsCount,
    lockedMaintenanceMargin,
    handlePositionsPress,
    isPortfolioMargin,
    theme.colors
  ])

  const handleWithdraw = useCallback(() => {
    router.navigate('/perpetualsWithdraw')
  }, [router])

  const handleTopUp = useCallback(() => {
    router.navigate('/perpetualsDeposit')
  }, [router])

  const renderFooter = useCallback(
    () => (
      <View sx={{ flexDirection: 'row', gap: 12 }}>
        <Button
          type="secondary"
          size="large"
          onPress={handleWithdraw}
          style={{ flex: 1 }}>
          Withdraw
        </Button>
        <Button
          type="primary"
          size="large"
          onPress={handleTopUp}
          style={{ flex: 1 }}>
          Top up
        </Button>
      </View>
    ),
    [handleWithdraw, handleTopUp]
  )

  if (balanceLoading) {
    return (
      <ScrollScreen
        isModal
        title="Available balance"
        navigationTitle="Available balance"
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <View
          testID="perps-balance-loading"
          sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.$textPrimary} />
        </View>
      </ScrollScreen>
    )
  }

  if (balanceUnknown) {
    return (
      <ScrollScreen
        isModal
        title="Available balance"
        navigationTitle="Available balance"
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <PerpsApiDownState onRetry={refetchBalance} />
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      isModal
      title="Available balance"
      subtitle="An overview of your Hyperliquid account"
      navigationTitle="Available balance"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, gap: 10 }}>
      {isGeoBlocked && <PerpsGeoRestrictionWarning />}

      <GroupList
        data={withdrawableRows}
        titleSx={{ fontFamily: 'Inter-Regular' }}
        subtitleVariant="subtitle2"
      />

      <View
        sx={{
          backgroundColor: theme.colors.$surfaceSecondary,
          borderRadius: 12,
          overflow: 'hidden'
        }}>
        <View sx={{ paddingTop: 50, paddingBottom: 40, alignItems: 'center' }}>
          <Text
            sx={{
              fontFamily: 'Aeonik-Medium',
              fontSize: 60,
              lineHeight: 60,
              color: theme.colors.$textPrimary
            }}>
            {heroValue !== undefined
              ? formatCurrency({ amount: heroValue })
              : '—'}
          </Text>
          <Text
            variant="subtitle2"
            sx={{
              color: alpha(theme.colors.$textPrimary, 0.6)
            }}>
            {isPortfolioMargin ? 'USDC account value' : 'Total account value'}
          </Text>
        </View>
        <GroupList
          data={accountRows}
          titleSx={{ fontFamily: 'Inter-Regular' }}
          subtitleVariant="subtitle2"
        />
      </View>
    </ScrollScreen>
  )
}
