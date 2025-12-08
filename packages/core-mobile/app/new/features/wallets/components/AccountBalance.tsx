import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  Icons,
  LoadingContent,
  Pressable,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { useBalanceInCurrencyForAccount } from 'features/portfolio/hooks/useBalanceInCurrencyForAccount'
import { useIsAccountsBalanceAccurate } from 'features/portfolio/hooks/useIsAccountsBalancesAccurate'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useSelector } from 'react-redux'
import { Account } from 'store/account'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

export const AccountBalance = ({
  isActive,
  account,
  variant = 'spinner'
}: {
  isActive: boolean
  account: Account
  variant?: 'spinner' | 'skeleton'
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { refetch, isFetching } = useAccountBalances(account)
  const { balance: accountBalance } = useBalanceInCurrencyForAccount(account.id)
  const isBalanceAccurate = useIsAccountsBalanceAccurate([account])

  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!isFetching) {
      setHasLoaded(true)
    }
  }, [isFetching])

  const balance = useMemo(() => {
    return accountBalance === 0
      ? formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
      : formatCurrency({
          amount: accountBalance,
          notation: accountBalance < 100000 ? undefined : 'compact'
        })
  }, [accountBalance, formatCurrency])

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
    if (isFetching) return null

    // Balance is 0 and all balances are accurate
    if (!accountBalance && isBalanceAccurate) return null

    // Balance is inaccurate
    if (!isBalanceAccurate)
      return (
        <Pressable hitSlop={16} onPress={refetch}>
          <Icons.Alert.Error
            color={colors.$textDanger}
            width={14}
            height={14}
          />
        </Pressable>
      )
  }, [
    accountBalance,
    colors.$textDanger,
    isBalanceAccurate,
    isFetching,
    refetch
  ])

  if (!hasLoaded && isFetching) {
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
        hideSpinner={isFetching}
        minOpacity={0.2}
        maxOpacity={1}
        isLoading={
          (!hasLoaded && isFetching) ||
          (hasLoaded && isFetching && !isBalanceAccurate)
        }>
        <AnimatedBalance
          variant="body1"
          balance={balance}
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
