import {
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
  const { accountValueUsd, withdrawableUsd, positions, clearinghouse } =
    usePerpsPositions()

  const heroValue = accountValueUsd ?? 0
  const withdrawable = withdrawableUsd ?? 0
  const availableForTrading = withdrawableUsd ?? 0
  const openPositionsCount = positions.length

  // Total unrealized P&L across open positions (mark-to-market).
  const unrealizedPnl = useMemo(
    () =>
      positions.reduce((sum, p) => sum + toNumber(p.position.unrealizedPnl), 0),
    [positions]
  )
  // Maintenance margin Hyperliquid keeps locked to keep open positions solvent
  // (a per-coin fraction of notional, not a flat %). Real clearinghouse figure,
  // surfaced as a subtitle since it's a subset of the collateral in positions.
  const lockedMaintenanceMargin = toNumber(
    clearinghouse?.crossMaintenanceMarginUsed
  )
  // Collateral committed to positions, defined as the remainder so the three
  // rows sum exactly to the total account value:
  //   total = available + collateralInPositions + unrealizedPnl
  // For unified accounts this remainder also folds in the pooled spot balance.
  const collateralInPositions = heroValue - withdrawable - unrealizedPnl

  useEffect(() => {
    AnalyticsService.capture('PerpetualsBalanceViewed')
  }, [])

  const handlePositionsPress = useCallback(() => {
    router.navigate('/perpetualsBalance/positions')
  }, [router])

  const withdrawableRows = useMemo<GroupListItem[]>(
    () => [
      {
        title: 'Withdrawable now',
        value: formatCurrency({ amount: withdrawable })
      }
    ],
    [formatCurrency, withdrawable]
  )

  const accountRows = useMemo<GroupListItem[]>(() => {
    const rows: GroupListItem[] = [
      {
        title: 'Available for trading',
        value: formatCurrency({ amount: availableForTrading })
      },
      {
        title: 'Collateral in positions',
        subtitle: `${openPositionsCount} position${
          openPositionsCount === 1 ? '' : 's'
        }`,
        value: formatCurrency({ amount: collateralInPositions }),
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
    // Informational (not part of the sum above): a subset of the collateral
    // Hyperliquid holds against open positions to keep them solvent.
    if (lockedMaintenanceMargin > 0) {
      rows.push({
        title: 'Maintenance margin',
        subtitle: 'Held within collateral in positions',
        value: formatCurrency({ amount: lockedMaintenanceMargin })
      })
    }
    return rows
  }, [
    formatCurrency,
    availableForTrading,
    collateralInPositions,
    unrealizedPnl,
    openPositionsCount,
    lockedMaintenanceMargin,
    handlePositionsPress,
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
            {formatCurrency({ amount: heroValue })}
          </Text>
          <Text
            variant="subtitle2"
            sx={{
              color: alpha(theme.colors.$textPrimary, 0.6)
            }}>
            Total account value
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
