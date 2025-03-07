import { noop } from '@avalabs/core-utils-sdk'
import { NavigationTitleHeader } from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsBalancesAccurateByNetwork,
  selectIsLoadingBalances
} from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'
import { useGetRecentTransactions } from 'store/transaction'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { useAnimatedStyle } from 'react-native-reanimated'
import TokenDetail from 'features/portfolio/assets/components/TokenDetail'
import { useNetworks } from 'hooks/networks/useNetworks'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { ActionButton } from 'features/portfolio/assets/components/ActionButtons'
import { useTokenDetailFilterAndSort } from 'features/portfolio/assets/hooks/useTokenDetailFilterAndSort'

const TokenDetailScreen = (): React.JSX.Element => {
  const { openUrl } = useInAppBrowser()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const { localId } = useLocalSearchParams<{
    localId: string
  }>()

  const { filteredTokenList } = useSearchableTokenList({})

  const token = useMemo(() => {
    return filteredTokenList.find(tk => tk.localId === localId)
  }, [filteredTokenList, localId])

  const { getNetwork } = useNetworks()

  const network = useMemo(() => {
    return getNetwork(token?.networkChainId)
  }, [token, getNetwork])

  const { transactions, refresh, isLoading, isRefreshing, isError } =
    useGetRecentTransactions(network)

  const transactionsBySymbol = useMemo(() => {
    return transactions.filter(tx => {
      return (
        !token?.symbol ||
        (tx.tokens[0]?.symbol && token.symbol === tx.tokens[0].symbol)
      )
    })
  }, [token, transactions])

  const { data, filter, sort } = useTokenDetailFilterAndSort({
    transactions: transactionsBySymbol
  })

  const selectedCurrency = useSelector(selectSelectedCurrency)

  const isBalanceAccurate = useSelector(
    selectIsBalancesAccurateByNetwork(token?.networkChainId)
  )

  const isBalanceLoading = useSelector(selectIsLoadingBalances)

  const handleBalanceHeaderLayout = (event: LayoutChangeEvent): void => {
    setBalanceHeaderLayout(event.nativeEvent.layout)
  }
  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: <NavigationTitleHeader title={token?.name ?? ''} />,
    targetLayout: balanceHeaderLayout
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const formattedBalance = useMemo(() => {
    if (token?.balanceInCurrency === undefined) return UNKNOWN_AMOUNT
    return formatCurrency({
      boostSmallNumberPrecision: false,
      amount: token?.balanceInCurrency,
      currency: selectedCurrency
    })
  }, [selectedCurrency, token?.balanceInCurrency])

  const ACTION_BUTTONS: ActionButton[] = [
    { title: ActionButtonTitle.Send, icon: 'send', onPress: noop },
    { title: ActionButtonTitle.Swap, icon: 'swap', onPress: noop },
    { title: ActionButtonTitle.Buy, icon: 'buy', onPress: noop },
    { title: ActionButtonTitle.Stake, icon: 'stake', onPress: noop },
    { title: ActionButtonTitle.Bridge, icon: 'bridge', onPress: noop },
    { title: ActionButtonTitle.Connect, icon: 'connect', onPress: noop }
  ]

  const handleExplorerLink = useCallback(
    (explorerLink: string): void => {
      AnalyticsService.capture('ActivityCardLinkClicked')
      openUrl(explorerLink)
    },
    [openUrl]
  )

  return (
    <TokenDetail
      token={token}
      data={data}
      filter={filter}
      sort={sort}
      actionButtons={ACTION_BUTTONS}
      handleExplorerLink={handleExplorerLink}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      isError={isError}
      refresh={refresh}
      isBalanceLoading={isBalanceLoading}
      isBalanceAccurate={isBalanceAccurate}
      selectedCurrency={selectedCurrency}
      animatedHeaderStyle={animatedHeaderStyle}
      formattedBalance={formattedBalance}
      onScroll={onScroll}
      handleBalanceHeaderLayout={handleBalanceHeaderLayout}
    />
  )
}

export default TokenDetailScreen
