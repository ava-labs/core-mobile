import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  LoadingContent,
  SxProp,
  useTheme
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useBalanceTotalInCurrencyForWallet } from 'features/portfolio/hooks/useBalanceTotalInCurrencyForWallet'
import { useIsLoadingBalancesForWallet } from 'features/portfolio/hooks/useIsLoadingBalancesForWallet'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { Wallet } from 'store/wallet/types'

export const WalletBalance = ({
  wallet,
  isRefreshing,
  balanceSx,
  variant = 'spinner'
}: {
  wallet: Wallet
  isRefreshing: boolean
  balanceSx?: SxProp
  variant?: 'spinner' | 'skeleton'
}): JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const isLoading = useIsLoadingBalancesForWallet(wallet)
  const balanceTotalInCurrency = useBalanceTotalInCurrencyForWallet(wallet)

  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!isLoading && balanceTotalInCurrency !== undefined) {
      setHasLoaded(true)
    }
  }, [isLoading, balanceTotalInCurrency])

  const walletBalance = useMemo(() => {
    // Show $- when in testnet mode
    if (isDeveloperMode) {
      return formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
    }

    // Show $0 for empty wallets on mainnet
    if (balanceTotalInCurrency === 0) {
      return formatCurrency({ amount: 0 }).replace('0.00', '0')
    }

    // Show actual balance for wallets with funds
    return formatCurrency({
      amount: balanceTotalInCurrency,
      notation: balanceTotalInCurrency < 100000 ? undefined : 'compact'
    })
  }, [formatCurrency, balanceTotalInCurrency, isDeveloperMode])

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

  if (!hasLoaded) {
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
    <LoadingContent
      hideSpinner
      minOpacity={0.2}
      maxOpacity={1}
      isLoading={isRefreshing}>
      <AnimatedBalance
        variant="heading4"
        balance={walletBalance}
        shouldMask={isPrivacyModeEnabled}
        balanceSx={{
          ...balanceSx,
          lineHeight: 21,
          fontSize: 21,
          textAlign: 'right'
        }}
        renderMaskView={renderMaskView}
      />
    </LoadingContent>
  )
}
