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
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import {
  selectBalanceTotalInCurrencyForWallet,
  selectIsLoadingBalances
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'

export const TotalAccountBalanceForWallet = ({
  walletId
}: {
  walletId: string
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors }
  } = useTheme()
  const tokenVisibility = useSelector(selectTokenVisibility)
  const isFetchingBalance = useSelector(selectIsLoadingBalances)
  const totalBalance = useSelector(
    selectBalanceTotalInCurrencyForWallet(walletId, tokenVisibility)
  )

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
        color: alpha(colors.$textPrimary, 0.6),
        lineHeight: 18,
        width: SCREEN_WIDTH * 0.3,
        textAlign: 'right'
      }}
      renderMaskView={renderMaskView}
      shouldAnimate={false}
    />
  )
}
