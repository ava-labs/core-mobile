import React, { useMemo, useState } from 'react'
import {
  View,
  BalanceHeader,
  NavigationTitleHeader,
  useTheme,
  SegmentedControl,
  alpha
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { LinearGradient } from 'expo-linear-gradient'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { RootState } from 'store'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { CollapsibleHeaderTabView } from 'react-native-scrollable-tab-view-collapsible-header'
import PortfolioCollectiblesScreen from './collectibles'
import { PortfolioScreen } from './assets'
import PortfolioDefiScreen from './defi'

const PortfolioHomeScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0)
  const context = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.index ?? 0,
      tokenVisibility
    )
  )
  const isLoading = isBalanceLoading || isRefetchingBalance
  const balanceAccurate = useSelector(
    selectBalanceForAccountIsAccurate(activeAccount?.index ?? 0)
  )
  const { selectedCurrency, currencyFormatter } = context.appHook

  const currencyBalance =
    !balanceAccurate && balanceTotalInCurrency === 0
      ? UNKNOWN_AMOUNT
      : currencyFormatter(balanceTotalInCurrency)

  const formattedBalance = currencyBalance.replace(selectedCurrency, '')

  const { getMarketToken } = useWatchlist()
  const tokens = useSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.index)
  )

  const totalPriceChanged = useMemo(
    () =>
      tokens.reduce((acc, token) => {
        const marketToken = getMarketToken(token.symbol)
        const percentChange = marketToken?.priceChangePercentage24h ?? 0
        const priceChange = token.balanceInCurrency
          ? (token.balanceInCurrency * percentChange) / 100
          : 0
        return acc + priceChange
      }, 0),
    [getMarketToken, tokens]
  )

  const indicatorStatus =
    totalPriceChanged > 0 ? 'up' : totalPriceChanged < 0 ? 'down' : 'equal'

  const totalPriceChangedInPercent = useMemo(() => {
    return (totalPriceChanged / balanceTotalInCurrency) * 100
  }, [balanceTotalInCurrency, totalPriceChanged])

  const formattedPercent = totalPriceChangedInPercent.toFixed(2) + '%'

  const handleBalanceHeaderLayout = (event: LayoutChangeEvent): void => {
    setBalanceHeaderLayout(event.nativeEvent.layout)
  }

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: (
      <NavigationTitleHeader
        title={activeAccount?.name ?? ''}
        subtitle={formattedBalance}
      />
    ),
    targetLayout: balanceHeaderLayout
  })

  const renderHeader = (): JSX.Element => {
    return (
      <View
        sx={{
          padding: 16,
          opacity: 1 - targetHiddenProgress,
          backgroundColor: '$surfacePrimary'
        }}
        onLayout={handleBalanceHeaderLayout}>
        <BalanceHeader
          accountName={activeAccount?.name ?? ''}
          formattedBalance={formattedBalance}
          currency={selectedCurrency}
          priceChange={{
            formattedPrice: Math.abs(totalPriceChanged).toFixed(2),
            status: indicatorStatus,
            formattedPercent
          }}
          errorMessage={
            balanceAccurate ? undefined : 'Unable to load all balances'
          }
          isLoading={isLoading}
        />
      </View>
    )
  }

  const handleScroll = (scrollX: number): void => {
    if (scrollX === Math.floor(scrollX)) {
      setSelectedSegmentIndex(scrollX)
    }
  }

  return (
    <BlurredBarsContentLayout>
      <CollapsibleHeaderTabView
        renderScrollHeader={renderHeader}
        renderTabBar={() => undefined}
        contentProps={{ style: { overflow: 'visible' } }}
        page={selectedSegmentIndex}
        onScroll={handleScroll}>
        <PortfolioScreen onScroll={onScroll} />
        <PortfolioCollectiblesScreen onScroll={onScroll} />
        <PortfolioDefiScreen onScroll={onScroll} />
      </CollapsibleHeaderTabView>
      <View sx={{ marginTop: 16, marginBottom: -1 }}>
        <LinearGradient
          colors={[alpha(colors.$surfacePrimary, 0), colors.$surfacePrimary]}
          style={{ height: 40 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />
        <View
          sx={{
            paddingBottom: 16,
            paddingHorizontal: 16,
            backgroundColor: colors.$surfacePrimary
          }}>
          <SegmentedControl
            dynamicItemWidth={false}
            items={['Assets', 'Collectibles', 'DeFi']}
            selectedSegmentIndex={selectedSegmentIndex}
            onSelectSegment={setSelectedSegmentIndex}
          />
        </View>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default PortfolioHomeScreen
