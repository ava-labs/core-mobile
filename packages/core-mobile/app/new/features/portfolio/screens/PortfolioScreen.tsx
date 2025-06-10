import {
  BalanceHeader,
  NavigationTitleHeader,
  PriceChangeStatus,
  SCREEN_HEIGHT,
  SegmentedControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useBottomTabBarHeight } from 'common/hooks/useBottomTabBarHeight'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useIsAndroidWithBottomBar } from 'common/hooks/useIsAndroidWithBottomBar'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useFocusEffect, useRouter } from 'expo-router'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import AssetsScreen from 'features/portfolio/assets/components/AssetsScreen'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { CollectibleFilterAndSortInitialState } from 'features/portfolio/collectibles/hooks/useCollectiblesFilterAndSort'
import { CollectiblesScreen } from 'features/portfolio/collectibles/screens/CollectiblesScreen'
import { DeFiScreen } from 'features/portfolio/defi/components/DeFiScreen'
import { useSendSelectedToken } from 'features/send/store'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  StyleSheet
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance'
import { promptEnableNotifications } from 'store/notifications'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { RootState } from 'store/types'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'

const SEGMENT_ITEMS = ['Assets', 'Collectibles', 'DeFi']

const PortfolioHomeScreen = (): JSX.Element => {
  const isPrivacyModeEnabled = useFocusedSelector(selectIsPrivacyModeEnabled)
  const [_, setSelectedToken] = useSendSelectedToken()
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { navigate, push } = useRouter()
  const { navigateToSwap } = useNavigateToSwap()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const selectedSegmentIndex = useSharedValue(0)
  const activeAccount = useFocusedSelector(selectActiveAccount)
  const isBalanceLoading = useFocusedSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useFocusedSelector(selectIsRefetchingBalances)
  const isDeveloperMode = useFocusedSelector(selectIsDeveloperMode)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useFocusedSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.index ?? 0,
      tokenVisibility
    )
  )

  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const isLoading = isBalanceLoading || isRefetchingBalance
  const balanceAccurate = useFocusedSelector(
    selectBalanceForAccountIsAccurate(activeAccount?.index ?? 0)
  )
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { formatCurrency } = useFormatCurrency()
  const formattedBalance = useMemo(() => {
    // CP-10570: Balances should never show $0.00
    return !balanceAccurate || balanceTotalInCurrency === 0
      ? UNKNOWN_AMOUNT
      : formatCurrency({
          amount: balanceTotalInCurrency,
          withoutCurrencySuffix: true
        })
  }, [balanceAccurate, balanceTotalInCurrency, formatCurrency])

  const { getMarketTokenBySymbol } = useWatchlist()
  const tokens = useFocusedSelector((state: RootState) =>
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

  const formattedPriceChange =
    totalPriceChanged > 0
      ? formatCurrency({ amount: Math.abs(totalPriceChanged) })
      : ''

  const indicatorStatus =
    totalPriceChanged > 0
      ? PriceChangeStatus.Up
      : totalPriceChanged < 0
      ? PriceChangeStatus.Down
      : PriceChangeStatus.Neutral

  const totalPriceChangedInPercent = useMemo(() => {
    return (totalPriceChanged / balanceTotalInCurrency) * 100
  }, [balanceTotalInCurrency, totalPriceChanged])

  const formattedPercent = useMemo(
    () =>
      isNaN(totalPriceChangedInPercent) || totalPriceChangedInPercent === 0
        ? undefined
        : totalPriceChangedInPercent.toFixed(2) + '%',
    [totalPriceChangedInPercent]
  )

  const handleBalanceHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setBalanceHeaderLayout(event.nativeEvent.layout)
    },
    []
  )

  useEffect(() => {
    dispatch(promptEnableNotifications)
  }, [dispatch])

  const handleSend = useCallback((): void => {
    setSelectedToken(undefined)
    // @ts-ignore TODO: make routes typesafe
    navigate('/send')
  }, [navigate, setSelectedToken])

  const handleReceive = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/receive')
  }, [navigate])

  const handleBuy = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/buy')
  }, [navigate])

  const header = useMemo(
    () => (
      <NavigationTitleHeader
        title={activeAccount?.name ?? ''}
        subtitle={formattedBalance}
        shouldMaskSubtitle={isPrivacyModeEnabled}
      />
    ),
    [activeAccount?.name, formattedBalance, isPrivacyModeEnabled]
  )

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header,
    targetLayout: balanceHeaderLayout,
    /*
     * there's a bug on the Portfolio screen where the BlurView
     * in the navigation header doesn't render correctly on initial load.
     * To work around it, we delay the BlurView's rendering slightly
     * so it captures the correct content behind it.
     *
     * note: we are also applying the same solution to the linear gradient bottom wrapper below
     */
    shouldDelayBlurOniOS: true
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleBridge = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/bridge'
    })
  }, [navigate])

  const actionButtons = useMemo(() => {
    const buttons: ActionButton[] = [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: handleSend }
    ]
    if (!isDeveloperMode) {
      buttons.push({
        title: ActionButtonTitle.Swap,
        icon: 'swap',
        onPress: () => navigateToSwap()
      })
    }
    buttons.push({
      title: ActionButtonTitle.Buy,
      icon: 'buy',
      onPress: handleBuy
    })
    buttons.push({
      title: ActionButtonTitle.Receive,
      icon: 'receive',
      onPress: handleReceive
    })
    buttons.push({
      title: ActionButtonTitle.Bridge,
      icon: 'bridge',
      onPress: handleBridge
    })
    return buttons
  }, [
    handleSend,
    handleBridge,
    handleReceive,
    handleBuy,
    isDeveloperMode,
    navigateToSwap
  ])

  const renderMaskView = useCallback((): JSX.Element => {
    return <HiddenBalanceText variant={'heading2'} sx={{ lineHeight: 38 }} />
  }, [])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: theme.colors.$surfacePrimary
        }}>
        <View onLayout={handleBalanceHeaderLayout}>
          <Animated.View
            style={[
              {
                backgroundColor: theme.colors.$surfacePrimary,
                marginTop: 16,
                paddingHorizontal: 16
              },
              animatedHeaderStyle
            ]}>
            <BalanceHeader
              accountName={activeAccount?.name ?? ''}
              formattedBalance={formattedBalance}
              currency={selectedCurrency}
              priceChange={
                totalPriceChanged > 0
                  ? {
                      formattedPrice: formattedPriceChange,
                      status: indicatorStatus,
                      formattedPercent
                    }
                  : undefined
              }
              errorMessage={
                balanceAccurate ? undefined : 'Unable to load all balances'
              }
              isLoading={isLoading}
              isPrivacyModeEnabled={isPrivacyModeEnabled}
              isDeveloperModeEnabled={isDeveloperMode}
              renderMaskView={renderMaskView}
            />
          </Animated.View>
        </View>

        <ActionButtons
          buttons={actionButtons}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 10
          }}
        />
      </View>
    )
  }, [
    renderMaskView,
    theme.colors.$surfacePrimary,
    handleBalanceHeaderLayout,
    animatedHeaderStyle,
    activeAccount?.name,
    formattedBalance,
    selectedCurrency,
    totalPriceChanged,
    indicatorStatus,
    formattedPercent,
    balanceAccurate,
    isLoading,
    isPrivacyModeEnabled,
    isDeveloperMode,
    formattedPriceChange,
    actionButtons
  ])

  const handleSelectSegment = useCallback(
    (index: number): void => {
      selectedSegmentIndex.value = index

      InteractionManager.runAfterInteractions(() => {
        if (tabViewRef.current?.getCurrentIndex() !== index) {
          tabViewRef.current?.setIndex(index)
        }
      })
    },
    [selectedSegmentIndex]
  )

  const handleTabChange: OnTabChange = useCallback(
    data => {
      if (selectedSegmentIndex.value === data.prevIndex) {
        selectedSegmentIndex.value = data.index
      }
    },
    [selectedSegmentIndex]
  )

  const handleGoToTokenDetail = useCallback(
    (localId: string, chainId: number): void => {
      // @ts-ignore TODO: make routes typesafe
      push({ pathname: '/tokenDetail', params: { localId, chainId } })
    },
    [push]
  )

  const handleGoToTokenManagement = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/tokenManagement')
  }, [navigate])

  const handleGoToCollectibleDetail = useCallback(
    (localId: string, initial: CollectibleFilterAndSortInitialState): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/collectibleDetail',
        params: { localId, initial: JSON.stringify(initial) }
      })
    },
    [navigate]
  )

  const handleGoToCollectibleManagement = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/collectibleManagement')
  }, [navigate])

  const handleGoToDiscoverCollectibles = useCallback((): void => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/discoverCollectibles'
    })
  }, [navigate])

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  const handleScrollResync = useCallback(() => {
    tabViewRef.current?.scrollResync()
  }, [])

  useFocusEffect(
    useCallback(() => {
      tabViewRef.current?.scrollResync()
    }, [])
  )

  const insets = useSafeAreaInsets()
  const isAndroidWithBottomBar = useIsAndroidWithBottomBar()
  const tabBarHeight = useBottomTabBarHeight()

  const tabHeight = useMemo(() => {
    return Platform.select({
      ios:
        SCREEN_HEIGHT -
        insets.top -
        (balanceHeaderLayout?.height ?? 0) -
        tabBarHeight -
        11,
      android: SCREEN_HEIGHT - insets.top + (isAndroidWithBottomBar ? -11 : 11)
    })
  }, [
    balanceHeaderLayout?.height,
    insets.top,
    isAndroidWithBottomBar,
    tabBarHeight
  ])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: 16,
      paddingTop: 10,
      minHeight: tabHeight
    }
  }, [tabHeight])

  const tabs = useMemo(() => {
    return [
      {
        tabName: 'Assets',
        component: (
          <AssetsScreen
            goToTokenDetail={handleGoToTokenDetail}
            goToTokenManagement={handleGoToTokenManagement}
            goToBuy={handleBuy}
            onScrollResync={handleScrollResync}
            containerStyle={contentContainerStyle}
          />
        )
      },
      {
        tabName: 'Collectibles',
        component: (
          <CollectiblesScreen
            goToCollectibleDetail={handleGoToCollectibleDetail}
            goToCollectibleManagement={handleGoToCollectibleManagement}
            goToDiscoverCollectibles={handleGoToDiscoverCollectibles}
            onScrollResync={handleScrollResync}
            containerStyle={contentContainerStyle}
          />
        )
      },
      {
        tabName: 'DeFi',
        component: (
          <DeFiScreen
            onScrollResync={handleScrollResync}
            containerStyle={contentContainerStyle}
          />
        )
      }
    ]
  }, [
    handleGoToTokenDetail,
    handleGoToTokenManagement,
    handleBuy,
    handleScrollResync,
    contentContainerStyle,
    handleGoToCollectibleDetail,
    handleGoToCollectibleManagement,
    handleGoToDiscoverCollectibles
  ])

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        onTabChange={handleTabChange}
        onScrollY={onScroll}
        tabs={tabs}
      />

      <LinearGradientBottomWrapper shouldDelayBlurOniOS={true}>
        <SegmentedControl
          dynamicItemWidth={false}
          items={SEGMENT_ITEMS}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={handleSelectSegment}
          style={styles.segmentedControl}
        />
      </LinearGradientBottomWrapper>
    </BlurredBarsContentLayout>
  )
}

const styles = StyleSheet.create({
  segmentedControl: { marginHorizontal: 16, marginBottom: 16 }
})

export enum PortfolioHomeScreenTab {
  Assets = 0,
  Collectibles = 1,
  DeFi = 2
}

export default PortfolioHomeScreen
