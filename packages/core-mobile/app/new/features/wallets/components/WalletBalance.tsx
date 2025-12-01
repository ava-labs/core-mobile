import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  SxProp,
  useTheme
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import React, { useCallback, useMemo } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

export const WalletBalance = ({
  // wallet,
  balanceSx,
  variant = 'spinner'
}: {
  // wallet: Wallet
  balanceSx?: SxProp
  variant?: 'spinner' | 'skeleton'
}): JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  // TODO: get wallet balance
  const walletBalance = 74235
  const isLoadingBalance = false

  const balance = useMemo(() => {
    return walletBalance > 0
      ? formatCurrency({
          amount: walletBalance,
          notation: walletBalance < 100000 ? undefined : 'compact'
        })
      : formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
  }, [formatCurrency, walletBalance])

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
        ...balanceSx,
        lineHeight: 21,
        fontSize: 21,
        textAlign: 'right'
      }}
      renderMaskView={renderMaskView}
    />
  )
}
