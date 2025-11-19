import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  Icons,
  Pressable,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useWalletBalances } from 'features/portfolio/hooks/useWalletBalances'
import React, { useCallback, useMemo } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { Wallet } from 'store/wallet/types'

export const WalletBalance = ({
  wallet,
  variant = 'spinner'
}: {
  wallet: Wallet
  variant?: 'spinner' | 'skeleton'
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { data: walletBalances } = useWalletBalances(wallet)

  const { formatCurrency } = useFormatCurrency()
  const walletBalance = 1000

  const isLoadingBalance = useMemo(() => {
    return walletBalances?.[wallet.id] === undefined
  }, [walletBalances, wallet.id])

  const refetchBalance = useCallback(() => {
    // TODO: implement refetch balance
    // dispatch(refetchBalanceForAccount(account.id))
  }, [])

  const balance = useMemo(() => {
    return walletBalance === 0
      ? formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
      : formatCurrency({ amount: walletBalance })
  }, [walletBalance, formatCurrency])

  const renderMaskView = useCallback(() => {
    return (
      <HiddenBalanceText
        variant={'heading6'}
        sx={{
          color: alpha(colors.$textPrimary, 0.6),
          lineHeight: 18
        }}
      />
    )
  }, [colors.$textPrimary])

  if (isLoadingBalance) {
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
    return <ActivityIndicator size="small" />
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
      <Pressable hitSlop={16} onPress={refetchBalance}>
        <Icons.Alert.Error color={colors.$textDanger} width={14} height={14} />
      </Pressable>
      <AnimatedBalance
        variant="body1"
        balance={balance}
        shouldMask={isPrivacyModeEnabled}
        balanceSx={{
          color: alpha(colors.$textPrimary, 0.6),
          lineHeight: 16,
          textAlign: 'right'
        }}
        renderMaskView={renderMaskView}
      />
    </View>
  )
}
