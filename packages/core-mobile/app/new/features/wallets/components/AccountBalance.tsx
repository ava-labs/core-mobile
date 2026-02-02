import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  LoadingContent,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import React, { useCallback, useMemo } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

export const AccountBalance = ({
  isActive,
  balance,
  isLoading,
  isAccurate,
  hasLoaded,
  isRefreshing,
  errorMessage,
  variant = 'spinner'
}: {
  isActive: boolean
  balance: number
  isLoading: boolean
  isAccurate: boolean
  hasLoaded?: boolean
  isRefreshing?: boolean
  errorMessage: string
  variant?: 'spinner' | 'skeleton'
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const accountBalance = useMemo(() => {
    // Show $- when in testnet mode
    if (isDeveloperMode) {
      return formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
    }

    // Show $0 for empty accounts on mainnet
    if (balance === 0) {
      return formatCurrency({ amount: 0 }).replace('0.00', '0')
    }

    return formatCurrency({
      amount: balance,
      notation: balance < 100000 ? undefined : 'compact',
      showLessThanThreshold: true
    })
  }, [balance, formatCurrency, isDeveloperMode])

  const renderMaskView = useCallback(() => {
    return (
      <HiddenBalanceText
        variant={'heading6'}
        sx={{
          color: isActive
            ? colors.$textPrimary
            : alpha(colors.$textPrimary, 0.6),
          lineHeight: 18
        }}
      />
    )
  }, [colors.$textPrimary, isActive])

  const hasError = useMemo(() => {
    if (errorMessage) return true
    if (isLoading) return false

    // // Balance is 0 and all balances are accurate
    if (!balance && isAccurate) return false

    // Balance is inaccurate
    if (!balance && !isAccurate) return true
  }, [errorMessage, isLoading, balance, isAccurate])

  const isLoadingContent = useMemo(() => {
    return (
      (!hasLoaded && isLoading) ||
      (hasLoaded && isLoading && !isAccurate) ||
      (hasError && isRefreshing)
    )
  }, [hasLoaded, isLoading, isAccurate, hasError, isRefreshing])

  if (!hasLoaded && isLoading) {
    if (variant === 'skeleton') {
      return (
        <ContentLoader
          speed={1}
          width={60}
          height={16}
          viewBox={`0 0 60 16`}
          backgroundColor={isDark ? '#69696D' : '#D9D9D9'}
          foregroundColor={isDark ? '#3E3E43' : '#F2F2F3'}>
          <Rect x="0" y="0" width={60} height={16} rx={6} ry={6} />
        </ContentLoader>
      )
    }

    return <ActivityIndicator size="small" sx={{ marginRight: 4 }} />
  }

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexShrink: 1,
        gap: 6
      }}>
      <LoadingContent
        hideSpinner={!isAccurate}
        minOpacity={0.2}
        maxOpacity={1}
        isLoading={isLoadingContent}
        hasError={hasError}
        alertOptions={{
          title: 'Unable to load balance',
          description: errorMessage,
          buttons: [{ text: 'Close' }]
        }}>
        <AnimatedBalance
          variant="body1"
          balance={accountBalance}
          shouldMask={isPrivacyModeEnabled}
          balanceSx={{
            color: isActive
              ? colors.$textPrimary
              : alpha(colors.$textPrimary, 0.6),
            lineHeight: 16,
            textAlign: 'right'
          }}
          renderMaskView={renderMaskView}
          shouldAnimate={false}
        />
      </LoadingContent>
    </View>
  )
}
