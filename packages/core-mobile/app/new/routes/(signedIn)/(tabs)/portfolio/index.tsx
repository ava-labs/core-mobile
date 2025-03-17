import { noop } from '@avalabs/core-utils-sdk'
import {
  BalanceHeader,
  NavigationTitleHeader,
  SegmentedControl,
  useTheme,
  PriceChangeStatus,
  View
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  CollapsibleTabs,
  CollapsibleTabsRef
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useRouter } from 'expo-router'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import AssetsScreen from 'features/portfolio/assets/components/AssetsScreen'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { CollectiblesScreen } from 'features/portfolio/collectibles/components/CollectiblesScreen'
import { DeFiScreen } from 'features/portfolio/defi/components/DeFiScreen'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle, Platform } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  SharedValue
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { selectActiveAccount } from 'store/account'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

const PortfolioHomeScreen = (): JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const { theme } = useTheme()
  const { navigate } = useRouter()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const selectedSegmentIndex = useSharedValue(0)
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
      ? '$' + UNKNOWN_AMOUNT
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
    totalPriceChanged > 0
      ? PriceChangeStatus.Up
      : totalPriceChanged < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral

  const totalPriceChangedInPercent = useMemo(() => {
    return (totalPriceChanged / balanceTotalInCurrency) * 100
  }, [balanceTotalInCurrency, totalPriceChanged])

  const formattedPercent =
    isNaN(totalPriceChangedInPercent) || totalPriceChangedInPercent === 0
      ? undefined
      : totalPriceChangedInPercent.toFixed(2) + '%'

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
                backgroundColor: theme.colors.$surfacePrimary,
                marginTop: Platform.OS === 'ios' ? 24 : 8
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
              isPrivacyModeEnabled={isPrivacyModeEnabled}
            />
          </Animated.View>
        </View>
        <ActionButtons buttons={ACTION_BUTTONS} />
      </View>
    )
  }

  const handleSelectSegment = (index: number): void => {
    if (tabViewRef.current?.getCurrentIndex() !== index) {
      tabViewRef.current?.setIndex(index)
    }
  }

  const handleChangeTab = (index: number): void => {
    selectedSegmentIndex.value = index
  }

  const handleGoToTokenDetail = useCallback(
    (localId: string): void => {
      navigate({ pathname: '/tokenDetail', params: { localId } })
    },
    [navigate]
  )

  const handleGoToTokenManagement = useCallback((): void => {
    navigate('/tokenManagement')
  }, [navigate])

  const handleGoToCollectibleDetail = useCallback((): void => {
    // navigate to token detail
  }, [])

  const handleGoToCollectibleManagement = useCallback((): void => {
    navigate('/collectibleManagement')
  }, [navigate])

  const handleScrollTab = (tabIndex: SharedValue<number>): void => {
    selectedSegmentIndex.value = tabIndex.value
  }

  const renderEmptyTabBar = (): JSX.Element => <></>

  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        onIndexChange={handleChangeTab}
        onScrollTab={handleScrollTab}
        onScrollY={onScroll}
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
            component: (
              <CollectiblesScreen
                goToCollectibleDetail={handleGoToCollectibleDetail}
                goToCollectibleManagement={handleGoToCollectibleManagement}
              />
            )
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
