import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  Icons,
  SxProp,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import React, { useCallback, useMemo } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Pressable } from 'react-native'
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
  const isBalanceAccurate = true
  const isLoadingBalance = false
  const refetchBalance = useCallback(() => {
    // dispatch(refetchBalanceForAccount(account.id))
  }, [])

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

  if (!isBalanceAccurate) {
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
          <Icons.Alert.Error
            color={colors.$textDanger}
            width={14}
            height={14}
          />
        </Pressable>
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
      </View>
    )
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
