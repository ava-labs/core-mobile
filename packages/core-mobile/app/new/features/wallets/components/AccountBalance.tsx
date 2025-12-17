import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  Icons,
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
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

export const AccountBalance = ({
  isActive,
  balance,
  isLoading,
  isAccurate,
  hasLoaded,
  variant = 'spinner'
}: {
  isActive: boolean
  balance: number
  isLoading: boolean
  isAccurate: boolean
  hasLoaded?: boolean
  variant?: 'spinner' | 'skeleton'
  balancesRefetchInterval?: number | false
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const accountBalance = useMemo(() => {
    return balance === 0
      ? formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
      : formatCurrency({
          amount: balance,
          notation: balance < 100000 ? undefined : 'compact'
        })
  }, [balance, formatCurrency])

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

  const renderError = useCallback(() => {
    if (isLoading) return null

    // // Balance is 0 and all balances are accurate
    if (!balance && isAccurate) return null

    // Balance is inaccurate
    if (!balance && !isAccurate)
      return (
        // <Pressable hitSlop={16} onPress={refetch}>
        <Icons.Alert.Error color={colors.$textDanger} width={14} height={14} />
        // </Pressable>
      )
  }, [balance, colors.$textDanger, isLoading, isAccurate])

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
      {renderError()}
      <LoadingContent
        hideSpinner={isLoading}
        minOpacity={0.2}
        maxOpacity={1}
        isLoading={
          (!hasLoaded && isLoading) || (hasLoaded && isLoading && !isAccurate)
        }>
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
