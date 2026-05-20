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
import { computeAccountBalance } from 'features/portfolio/utils/computeAccountBalance'
import { formatBalanceDisplay } from 'features/wallets/utils/formatBalanceDisplay'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { useSelector } from 'react-redux'
import {
  AdjustedNormalizedBalancesForAccount,
  AdjustedNormalizedBalancesForAccounts
} from 'services/balance/types'
import { Networks } from 'store/network/types'
import { TokenVisibility } from 'store/portfolio'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

const emptyAccountBalances: AdjustedNormalizedBalancesForAccount[] = []

interface WalletBalanceProps {
  isRefreshing: boolean
  walletBalancesData: AdjustedNormalizedBalancesForAccounts
  isBalancesError: boolean
  /**
   * Map from accountId to the number of enabled networks that account can
   * actually produce balance entries for (see CP-14303). The wallet total
   * is considered loaded when every account has at least that many entries.
   */
  enabledNetworksCountByAccount: Record<string, number>
  enabledNetworksMap: Networks
  enabledChainIds: number[]
  isDeveloperMode: boolean
  tokenVisibility: TokenVisibility
  balanceSx?: SxProp
  variant?: 'spinner' | 'skeleton'
}

const WalletBalanceComponent = ({
  isRefreshing,
  walletBalancesData,
  isBalancesError,
  enabledNetworksCountByAccount,
  enabledNetworksMap,
  enabledChainIds,
  isDeveloperMode,
  tokenVisibility,
  balanceSx,
  variant = 'spinner'
}: WalletBalanceProps): JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors, isDark }
  } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const { isLoading, balanceTotalInCurrency } = useMemo(() => {
    const accountEntries = Object.entries(walletBalancesData)

    let loading = accountEntries.length === 0
    let total = 0
    for (const [accountId, accountBalances] of accountEntries) {
      const result = computeAccountBalance({
        accountBalances: accountBalances ?? emptyAccountBalances,
        enabledNetworksCount: enabledNetworksCountByAccount[accountId] ?? 0,
        enabledNetworksMap,
        enabledChainIds,
        isDeveloperMode,
        tokenVisibility,
        isError: isBalancesError
      })
      if (result.isLoadingBalance) loading = true
      total += result.balance
    }

    return { isLoading: loading, balanceTotalInCurrency: total }
  }, [
    walletBalancesData,
    enabledNetworksCountByAccount,
    enabledNetworksMap,
    enabledChainIds,
    isDeveloperMode,
    tokenVisibility,
    isBalancesError
  ])

  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (!isLoading && balanceTotalInCurrency !== undefined) {
      setHasLoaded(true)
    }
  }, [isLoading, balanceTotalInCurrency])

  const walletBalance = useMemo(() => {
    return formatBalanceDisplay({
      balance: balanceTotalInCurrency,
      isDeveloperMode,
      formatCurrency
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

export const WalletBalance = React.memo(WalletBalanceComponent)
