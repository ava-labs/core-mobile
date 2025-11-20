import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  useTheme
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
    return false
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
    <AnimatedBalance
      variant="heading4"
      balance={balance}
      shouldMask={isPrivacyModeEnabled}
      balanceSx={{
        lineHeight: 21,
        fontSize: 21,
        textAlign: 'right'
      }}
      renderMaskView={renderMaskView}
    />
  )
}
