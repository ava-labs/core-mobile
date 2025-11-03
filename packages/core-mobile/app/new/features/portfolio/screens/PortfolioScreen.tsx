import {
  BalanceHeader,
  NavigationTitleHeader,
  PriceChangeStatus,
  SegmentedControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BottomTabWrapper } from 'common/components/BlurredBottomWrapper'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'

import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useFocusEffect, useRouter } from 'expo-router'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'
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
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AnalyticsEventName } from 'services/analytics/types'
import { selectActiveAccount } from 'store/account'
import {
  LocalTokenWithBalance,
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectIsBalanceLoadedForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import {
  selectIsBridgeBlocked,
  selectIsMeldOfframpBlocked
} from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { RootState } from 'store/types'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'

const SEGMENT_ITEMS = [
  { title: 'Assets' },
  { title: 'Collectibles' },
  { title: 'DeFi' }
]

const SEGMENT_EVENT_MAP: Record<number, AnalyticsEventName> = {
  0: 'PortfolioAssetsClicked',
  1: 'PortfolioCollectiblesClicked',
  2: 'PortfolioDeFiClicked'
}

const PortfolioHomeScreen = (): JSX.Element => {
  const frame = useSafeAreaFrame()
  const headerHeight = useHeaderHeight()
  const isMeldOfframpBlocked = useSelector(selectIsMeldOfframpBlocked)
  const isBridgeBlocked = useSelector(selectIsBridgeBlocked)

  const { navigateToBuy } = useBuy()
  const { navigateToWithdraw } = useWithdraw()
  const isPrivacyModeEnabled = useFocusedSelector(selectIsPrivacyModeEnabled)
  const [_, setSelectedToken] = useSendSelectedToken()
  const { theme } = useTheme()
  const { navigate, push } = useRouter()
  const { navigateToSwap } = useNavigateToSwap()

  const [stickyHeaderLayout, setStickyHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens
  })
  const selectedSegmentIndex = useSharedValue(0)
  const activeAccount = useFocusedSelector(selectActiveAccount)
  const isBalanceLoading = useFocusedSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useFocusedSelector(selectIsRefetchingBalances)
  const isDeveloperMode = useFocusedSelector(selectIsDeveloperMode)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useFocusedSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.id ?? '',
      tokenVisibility
    )
  )

  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const isBalanceLoaded = useFocusedSelector(
    selectIsBalanceLoadedForAccount(activeAccount?.id ?? '')
  )
  const isLoading = isBalanceLoading || isRefetchingBalance || !isBalanceLoaded
  const balanceAccurate = useFocusedSelector(
    selectBalanceForAccountIsAccurate(activeAccount?.id ?? '')
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
    selectTokensWithBalanceForAccount(state, activeAccount?.id ?? '')
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
    totalPriceChanged !== 0
      ? formatCurrency({ amount: Math.abs(totalPriceChanged) })
      : undefined

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
      !isFinite(totalPriceChangedInPercent) || totalPriceChangedInPercent === 0
        ? undefined
        : totalPriceChangedInPercent.toFixed(2) + '%',
    [totalPriceChangedInPercent]
  )

  const handleStickyHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setStickyHeaderLayout(event.nativeEvent.layout)
    },
    []
  )

  const handleBalanceHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setBalanceHeaderLayout(event.nativeEvent.layout)
    },
    []
  )

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

  const handleSend = useCallback((): void => {
    setSelectedToken(undefined)
    // @ts-ignore TODO: make routes typesafe
    navigate('/send')
  }, [navigate, setSelectedToken])

  const handleReceive = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/receive')
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
      onPress: navigateToBuy
    })
    buttons.push({
      title: ActionButtonTitle.Receive,
      icon: 'receive',
      onPress: handleReceive
    })
    if (!isBridgeBlocked) {
      buttons.push({
        title: ActionButtonTitle.Bridge,
        icon: 'bridge',
        onPress: handleBridge
      })
    }
    if (!isMeldOfframpBlocked) {
      buttons.push({
        title: ActionButtonTitle.Withdraw,
        icon: 'withdraw',
        onPress: navigateToWithdraw
      })
    }
    return buttons
  }, [
    handleSend,
    isDeveloperMode,
    navigateToBuy,
    navigateToWithdraw,
    handleReceive,
    handleBridge,
    navigateToSwap,
    isMeldOfframpBlocked,
    isBridgeBlocked
  ])

  const renderMaskView = useCallback((): JSX.Element => {
    return <HiddenBalanceText variant={'heading2'} sx={{ lineHeight: 38 }} />
  }, [])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: theme.colors.$surfacePrimary
        }}
        onLayout={handleStickyHeaderLayout}>
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
              testID="portfolio"
              accountName={activeAccount?.name}
              formattedBalance={formattedBalance}
              currency={selectedCurrency}
              priceChange={
                totalPriceChanged !== 0
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

        {filteredTokenList.length > 0 && (
          <ActionButtons
            buttons={actionButtons}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 10
            }}
          />
        )}
      </View>
    )
  }, [
    theme.colors.$surfacePrimary,
    handleStickyHeaderLayout,
    handleBalanceHeaderLayout,
    animatedHeaderStyle,
    activeAccount?.name,
    formattedBalance,
    selectedCurrency,
    totalPriceChanged,
    formattedPriceChange,
    indicatorStatus,
    formattedPercent,
    balanceAccurate,
    isLoading,
    isPrivacyModeEnabled,
    isDeveloperMode,
    renderMaskView,
    filteredTokenList.length,
    actionButtons
  ])

  const handleSelectSegment = useCallback(
    (index: number): void => {
      const eventName = SEGMENT_EVENT_MAP[index]

      if (eventName) {
        AnalyticsService.capture(eventName)
      }

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
    (token: LocalTokenWithBalance): void => {
      const { name, symbol, localId, networkChainId } = token
      AnalyticsService.capture('PortfolioTokenSelected', {
        name,
        symbol,
        chainId: networkChainId
      })
      push({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/tokenDetail',
        params: { localId, chainId: networkChainId }
      })
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

  const tabHeight = useMemo(() => {
    return Platform.select({
      ios: frame.height - headerHeight,
      android: frame.height - headerHeight + (stickyHeaderLayout?.height ?? 0)
    })
  }, [frame.height, headerHeight, stickyHeaderLayout?.height])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: (segmentedControlLayout?.height ?? 0) + 32,
      paddingTop: 10,
      minHeight: tabHeight
    }
  }, [segmentedControlLayout?.height, tabHeight])

  const tabs = useMemo(() => {
    return [
      {
        tabName: 'Assets',
        component: (
          <AssetsScreen
            goToTokenDetail={handleGoToTokenDetail}
            goToTokenManagement={handleGoToTokenManagement}
            goToBuy={navigateToBuy}
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
    navigateToBuy,
    handleScrollResync,
    contentContainerStyle,
    handleGoToCollectibleDetail,
    handleGoToCollectibleManagement,
    handleGoToDiscoverCollectibles
  ])

  const renderSegmentedControl = useCallback((): JSX.Element => {
    return (
      <SegmentedControl
        dynamicItemWidth={false}
        items={SEGMENT_ITEMS}
        selectedSegmentIndex={selectedSegmentIndex}
        onSelectSegment={handleSelectSegment}
        style={{
          marginHorizontal: 16,
          marginBottom: 16
        }}
      />
    )
  }, [handleSelectSegment, selectedSegmentIndex])

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

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0
        }}
        onLayout={handleSegmentedControlLayout}>
        <BottomTabWrapper>{renderSegmentedControl()}</BottomTabWrapper>
      </View>
    </BlurredBarsContentLayout>
  )
}

export default PortfolioHomeScreen
