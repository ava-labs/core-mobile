import React, { useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  SCREEN_WIDTH,
  useTheme
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useBalanceTotalInCurrencyForWallet } from 'features/portfolio/hooks/useBalanceTotalInCurrencyForWallet'
import { Wallet } from 'store/wallet/types'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useIsRefetchingBalancesForWallet } from 'features/portfolio/hooks/useIsRefetchingBalancesForWallet'

export const TotalAccountBalanceForWallet = ({
  wallet
}: {
  wallet: Wallet
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors }
  } = useTheme()
  const isFetchingBalance = useIsRefetchingBalancesForWallet(wallet)
  const totalBalance = useBalanceTotalInCurrencyForWallet(wallet)

  const { formatCurrency } = useFormatCurrency()

  const balance = useMemo(() => {
    return totalBalance === 0
      ? formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
      : formatCurrency({ amount: totalBalance })
  }, [totalBalance, formatCurrency])

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

  if (isFetchingBalance) {
    return <ActivityIndicator size="small" sx={{ marginRight: 4 }} />
  }

  return (
    <AnimatedBalance
      variant="body1"
      balance={balance}
      shouldMask={isPrivacyModeEnabled}
      balanceSx={{
        color: colors.$textPrimary,
        lineHeight: 18,
        width: SCREEN_WIDTH * 0.3,
        textAlign: 'right'
      }}
      renderMaskView={renderMaskView}
      shouldAnimate={false}
    />
  )
}
