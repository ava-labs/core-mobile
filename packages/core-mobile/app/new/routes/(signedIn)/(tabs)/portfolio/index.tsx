import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  View,
  BalanceHeader,
  NavigationTitleHeader,
  useTheme,
  SegmentedControl
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { useApplicationContext } from 'contexts/ApplicationContext'
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
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import AssetsScreen from 'features/portfolio/assets/components/AssetsScreen'
import { CollectiblesScreen } from 'features/portfolio/collectibles/components/CollectiblesScreen'
import { DeFiScreen } from 'features/portfolio/defi/components/DeFiScreen'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { noop } from '@avalabs/core-utils-sdk'
import {
  CollapsibleTabs,
  CollapsibleTabsRef
} from 'common/components/CollapsibleTabs'
import { useRouter } from 'expo-router'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'

const PortfolioHomeScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()
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

  const { getMarketTokenBySymbol } = useWatchlist()
  const tokens = useSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.index)
  )

  const totalPriceChanged = useMemo(
    () =>
      tokens.reduce((acc, token) => {
        const marketToken = getMarketTokenBySymbol(token.symbol)
        const percentChange = marketToken?.priceChangePercentage24h ?? 0
        const priceChange = token.balanceInCurrency
          ? (token.balanceInCurrency * percentChange) / 100
          : 0
        return acc + priceChange
      }, 0),
    [getMarketTokenBySymbol, tokens]
  )

  const indicatorStatus =
    totalPriceChanged > 0 ? 'up' : totalPriceChanged < 0 ? 'down' : 'equal'

  const totalPriceChangedInPercent = useMemo(() => {
    return (totalPriceChanged / balanceTotalInCurrency) * 100
  }, [balanceTotalInCurrency, totalPriceChanged])

  const formattedPercent =
    (isNaN(totalPriceChangedInPercent)
      ? UNKNOWN_AMOUNT
      : totalPriceChangedInPercent.toFixed(2)) + '%'

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

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const ACTION_BUTTONS: ActionButton[] = [
    { title: ActionButtonTitle.Send, icon: 'send', onPress: noop },
    { title: ActionButtonTitle.Swap, icon: 'swap', onPress: noop },
    { title: ActionButtonTitle.Buy, icon: 'buy', onPress: noop },
    { title: ActionButtonTitle.Stake, icon: 'stake', onPress: noop },
    { title: ActionButtonTitle.Bridge, icon: 'bridge', onPress: noop },
    { title: ActionButtonTitle.Connect, icon: 'connect', onPress: noop }
  ]

  const renderHeader = (): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: theme.colors.$surfacePrimary,
          paddingHorizontal: 16
        }}>
        <View onLayout={handleBalanceHeaderLayout}>
          <Animated.View
            style={[
              {
                paddingBottom: 16,
                backgroundColor: theme.colors.$surfacePrimary
              },
              animatedHeaderStyle
            ]}>
            <BalanceHeader
              accountName={activeAccount?.name ?? ''}
              formattedBalance={formattedBalance}
              currency={selectedCurrency}
              priceChange={{
                formattedPrice: `$${Math.abs(totalPriceChanged).toFixed(2)}`,
                status: indicatorStatus,
                formattedPercent
              }}
              errorMessage={
                balanceAccurate ? undefined : 'Unable to load all balances'
              }
              isLoading={isLoading}
            />
          </Animated.View>
        </View>
        <ActionButtons buttons={ACTION_BUTTONS} />
      </View>
    )
  }

  const handleSelectSegment = (index: number): void => {
    if (index !== selectedSegmentIndex) {
      tabViewRef.current?.setIndex(index)
    }
  }

  const handleChangeTab = (index: number): void => {
    setSelectedSegmentIndex(index)
  }

  const handleGoToTokenDetail = useCallback(
    (localId: string): void => {
      navigate(`/portfolio/tokenDetail?localId=${localId}`)
    },
    [navigate]
  )

  const handleGoToTokenManagement = useCallback((): void => {
    navigate('/tokenManagement')
  }, [navigate])

  const renderEmptyTabBar = (): JSX.Element => <></>

  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        onIndexChange={handleChangeTab}
        onScroll={onScroll}
        tabs={[
          {
            tabName: 'Assets',
            component: (
              <AssetsScreen
                goToTokenDetail={handleGoToTokenDetail}
                goToTokenManagement={handleGoToTokenManagement}
              />
            )
          },
          {
            tabName: 'Collectibles',
            component: <CollectiblesScreen />
          },
          {
            tabName: 'DeFi',
            component: <DeFiScreen />
          }
        ]}
      />
      <LinearGradientBottomWrapper>
        <SegmentedControl
          dynamicItemWidth={true}
          items={['Assets', 'Collectibles', 'DeFi']}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={handleSelectSegment}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        />
      </LinearGradientBottomWrapper>
    </BlurredBarsContentLayout>
  )
}

export enum PortfolioHomeScreenTab {
  Assets = 0,
  Collectibles = 1,
  DeFi = 2
}

export default PortfolioHomeScreen
