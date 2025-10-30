import React, { useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  Icons,
  Pressable,
  SCREEN_WIDTH,
  useTheme
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useBalanceFoXpAccount } from 'common/contexts/useBalanceForXpAccunt'
import { XpNetworkVMType } from 'store/network'

export const XpAccountBalance = ({
  isActive,
  walletId,
  networkType
}: {
  isActive: boolean
  walletId: string
  networkType: XpNetworkVMType
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors }
  } = useTheme()
  const {
    balance: accountBalance,
    fetchBalance,
    isFetchingBalance,
    isBalanceLoaded
  } = useBalanceFoXpAccount(walletId, networkType)
  const { formatCurrency } = useFormatCurrency()

  const balance = useMemo(() => {
    return accountBalance === 0
      ? formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
      : formatCurrency({ amount: accountBalance })
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

  if (isFetchingBalance) {
    return <ActivityIndicator size="small" sx={{ marginRight: 4 }} />
  }

  if (!isBalanceLoaded) {
    return (
      <Pressable onPress={fetchBalance}>
        <Icons.Custom.BalanceRefresh color={colors.$textPrimary} />
      </Pressable>
    )
  }

  return (
    <AnimatedBalance
      variant="body1"
      balance={balance}
      shouldMask={isPrivacyModeEnabled}
      balanceSx={{
        color: isActive ? colors.$textPrimary : alpha(colors.$textPrimary, 0.6),
        lineHeight: 18,
        width: SCREEN_WIDTH * 0.3,
        textAlign: 'right'
      }}
      renderMaskView={renderMaskView}
      shouldAnimate={false}
    />
  )
}
