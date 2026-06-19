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
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import AnalyticsService from 'services/analytics/AnalyticsService'

const HERO_VALUE = 1234.45
const WITHDRAWABLE = 856.78
const AVAILABLE_FOR_TRADING = 856.78
const LOCKED = 35.0
const IN_POSITIONS = 342.67
const PENDING = 0.0
const TOTAL_DEPOSITED = 2344.56
const TOTAL_WITHDRAWN = 500.0
const NET_DEPOSITS = 1844.56
const NET_PNL = 418.43
const ACCORDION_EXPAND_DURATION = 350

export const PerpetualsBalanceScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const router = useRouter()
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    AnalyticsService.capture('PerpetualsBalanceViewed')
  }, [])

  // Clear any pending scroll on unmount so it can't fire after teardown.
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  const handlePerformanceToggle = useCallback((expanded: boolean) => {
    // Cancel any pending scroll (e.g. a quick collapse) before scheduling.
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    if (expanded) {
      scrollTimeoutRef.current = setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        ACCORDION_EXPAND_DURATION
      )
    }
  }, [])

  const handlePositionsPress = useCallback(() => {
    router.navigate('/perpetualsBalance/positions')
  }, [router])

  const withdrawableRows = useMemo<GroupListItem[]>(
    () => [
      {
        title: 'Withdrawable now',
        value: formatCurrency({ amount: WITHDRAWABLE })
      }
    ],
    [formatCurrency]
  )

  const accountRows = useMemo<GroupListItem[]>(
    () => [
      {
        title: 'Available for trading',
        value: formatCurrency({ amount: AVAILABLE_FOR_TRADING })
      },
      {
        title: 'Locked (Security hold)',
        subtitle: 'Available March 9, 2026',
        value: formatCurrency({ amount: LOCKED })
      },
      {
        title: 'In active positions',
        subtitle: '3 positions',
        value: formatCurrency({ amount: IN_POSITIONS }),
        accessory: (
          <Icons.Navigation.ChevronRight
            color={theme.colors.$textSecondary}
            style={{ marginRight: -8 }}
          />
        ),
        onPress: handlePositionsPress
      },
      {
        title: 'Pending settlements',
        subtitle: 'Markets ending soon',
        value: formatCurrency({ amount: PENDING })
      }
    ],
    [formatCurrency, handlePositionsPress, theme.colors.$textSecondary]
  )

  const performanceBreakdown = useMemo<GroupListItem[]>(
    () => [
      {
        title: 'Total deposited',
        value: formatCurrency({ amount: TOTAL_DEPOSITED })
      },
      {
        title: 'Total withdrawn',
        value: formatCurrency({ amount: TOTAL_WITHDRAWN })
      },
      {
        title: 'Net deposits',
        value: formatCurrency({ amount: NET_DEPOSITS })
      },
      {
        title: 'Net profit/loss',
        value: `+${formatCurrency({ amount: NET_PNL })}`
      }
    ],
    [formatCurrency]
  )

  const performanceRows = useMemo<GroupListItem[]>(
    () => [
      {
        title: 'Account performance',
        subtitle: 'All-time performance',
        onAccordionToggle: handlePerformanceToggle,
        accordion: (
          <GroupList
            data={performanceBreakdown}
            titleSx={{ fontFamily: 'Inter-Regular' }}
            subtitleVariant="subtitle2"
          />
        )
      }
    ],
    [performanceBreakdown, handlePerformanceToggle]
  )

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
      ref={scrollViewRef}
      isModal
      title="Available balance"
      subtitle="An overview of your Hyperliquid account"
      navigationTitle="Available balance"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, gap: 10 }}>
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
            {formatCurrency({ amount: HERO_VALUE })}
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

      <GroupList
        data={performanceRows}
        titleSx={{ fontFamily: 'Inter-Regular' }}
        subtitleVariant="subtitle2"
      />
    </ScrollScreen>
  )
}
