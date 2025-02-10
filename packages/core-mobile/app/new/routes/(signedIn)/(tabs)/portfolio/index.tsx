import React, { useMemo, useState } from 'react'
import {
  ScrollView,
  View,
  BalanceHeader,
  NavigationTitleHeader,
  useTheme,
  SegmentedControl,
  alpha,
  ActivityIndicator
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
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
import PortfolioDefiScreen from './defi'
import PortfolioAssetsScreen from './assets'
import PortfolioCollectiblesScreen from './collectibles'

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

  const indicatorStatus =
    balanceTotalInCurrency > 0
      ? 'up'
      : balanceTotalInCurrency < 0
      ? 'down'
      : 'equal'

  const { getMarketToken } = useWatchlist()
  const tokens = useSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.index)
  )

  const totalPriceChanged = useMemo(
    () =>
      tokens.reduce((acc, token) => {
        const marketToken = getMarketToken(token.symbol)
        return acc + (marketToken?.priceChangePercentage24h ?? 0)
      }, 0),
    [getMarketToken, tokens]
  )

  const totalPriceChangedInPercent = useMemo(() => {
    return (totalPriceChanged / balanceTotalInCurrency) * 100
  }, [balanceTotalInCurrency, totalPriceChanged])

  const formattedPercent = totalPriceChangedInPercent.toFixed(2) + '%'

  const handleBalanceHeaderLayout = (event: LayoutChangeEvent): void => {
    setBalanceHeaderLayout(event.nativeEvent.layout)
  }

  const scrollViewProps = useFadingHeaderNavigation({
    header: (
      <NavigationTitleHeader
        title={activeAccount?.name ?? ''}
        subtitle={formattedBalance}
      />
    ),
    targetLayout: balanceHeaderLayout
  })

  const renderHeader = (): React.JSX.Element => {
    if (isBalanceLoading || isRefetchingBalance) {
      return <ActivityIndicator style={{ alignSelf: 'flex-start' }} />
    }
    return (
      <BalanceHeader
        accountName={activeAccount?.name ?? ''}
        formattedBalance={formattedBalance}
        currency={selectedCurrency}
        onLayout={handleBalanceHeaderLayout}
        priceChange={{
          formattedPrice: totalPriceChanged.toFixed(2),
          status: indicatorStatus,
          formattedPercent
        }}
        errorMessage={
          balanceAccurate ? undefined : 'Unable to load all balances'
        }
        isLoading={isLoading}
      />
    )
  }

  const renderContent = (): React.JSX.Element => {
    if (selectedSegmentIndex === 2) {
      return <PortfolioCollectiblesScreen />
    } else if (selectedSegmentIndex === 1) {
      return <PortfolioDefiScreen />
    }
    return <PortfolioAssetsScreen />
  }

  return (
    <BlurredBarsContentLayout>
      <ScrollView
        contentContainerSx={{
          paddingTop: 16,
          paddingHorizontal: 16,
          gap: 16
        }}
        {...scrollViewProps}>
        {renderHeader()}
        {renderContent()}
        <View>
          <LinearGradient
            colors={[alpha(colors.$surfacePrimary, 0), colors.$surfacePrimary]}
            style={{ height: 0 }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
          />
          <SegmentedControl
            dynamicItemWidth={false}
            items={['Assets', 'Collectibles', 'DeFi']}
            selectedSegmentIndex={selectedSegmentIndex}
            onSelectSegment={setSelectedSegmentIndex}
          />
        </View>
        <View />
      </ScrollView>
      <View sx={{ paddingHorizontal: 16 }}>
        <LinearGradient
          colors={[alpha(colors.$surfacePrimary, 0), colors.$surfacePrimary]}
          style={{ height: 40 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />
        <View
          sx={{ paddingBottom: 16, backgroundColor: colors.$surfacePrimary }}>
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
