import {
  NavigationTitleHeader,
  showAlert,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { BottomTabWrapper } from 'common/components/BlurredBottomWrapper'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SegmentedControl } from 'common/components/SegmentedControl'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
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
import { BalanceHeaderSection } from 'features/portfolio/components/BalanceHeaderSection'
import { DeFiScreen } from 'features/portfolio/defi/components/DeFiScreen'
import { useAccountBalanceSummary } from 'features/portfolio/hooks/useAccountBalanceSummary'
import { useAccountPerformanceSummary } from 'features/portfolio/hooks/useAccountPerformanceSummary'
import { useBalanceTotalPriceChangeForAccount } from 'features/portfolio/hooks/useBalanceTotalPriceChangeForAccount'
import { useSendSelectedToken } from 'features/send/store'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform
} from 'react-native'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AnalyticsEventName } from 'services/analytics/types'
import { WalletType } from 'services/wallet/types'
import { selectActiveAccount } from 'store/account'
import { LocalTokenWithBalance } from 'store/balance/types'
import {
  selectIsBridgeBlocked,
  selectIsMeldOfframpBlocked
} from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { selectActiveWallet, selectWalletsCount } from 'store/wallet/slice'
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
  const headerHeight = useEffectiveHeaderHeight()
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
  const isDeveloperMode = useFocusedSelector(selectIsDeveloperMode)

  const {
    totalBalanceInCurrency: balanceTotalInCurrency,
    isBalanceLoaded,
    isLoading: isLoadingBalances,
    isRefetching: isRefetchingBalance,
    isAllBalancesInaccurate: allBalancesInaccurate
  } = useAccountBalanceSummary(activeAccount)

  const totalPriceChange = useBalanceTotalPriceChangeForAccount(activeAccount)
  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const isLoading = isRefetchingBalance || !isBalanceLoaded
  const activeWallet = useSelector(selectActiveWallet)
  const walletsCount = useSelector(selectWalletsCount)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { formatCurrency } = useFormatCurrency()
  const formattedBalance = useMemo(() => {
    // CP-10570: Balances should never show $0.00
    return allBalancesInaccurate || balanceTotalInCurrency === 0
      ? formatCurrency({
          amount: 0,
          withoutCurrencySuffix: true
        }).replace('0.00', UNKNOWN_AMOUNT)
      : formatCurrency({
          amount: balanceTotalInCurrency,
          withoutCurrencySuffix: true
        })
  }, [allBalancesInaccurate, balanceTotalInCurrency, formatCurrency])

  const { percentChange24h, valueChange24h, indicatorStatus } =
    useAccountPerformanceSummary(activeAccount)

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
        renderMaskedSubtitle={
          isPrivacyModeEnabled
            ? () => (
                <HiddenBalanceText
                  variant="caption"
                  isCurrency={true}
                  sx={{ color: '$textSecondary' }}
                />
              )
            : undefined
        }
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

  const openWalletsModal = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/(signedIn)/(modals)/wallets'
    })
  }, [navigate])

  const handleErrorPress = useCallback(() => {
    showAlert({
      title: 'Unable to load balances',
      description:
        'This total may be incomplete since Core was unable to load all of the balances across each network.',
      buttons: [{ text: 'Dismiss' }]
    })
  }, [])

  const walletName = useMemo(() => {
    if (walletsCount > 1) {
      if (activeWallet?.type === WalletType.PRIVATE_KEY) {
        return 'Imported'
      }

      return activeWallet?.name
    }
    return undefined
  }, [activeWallet?.name, activeWallet?.type, walletsCount])

  const walletIcon = useMemo(() => {
    if (
      activeWallet?.type === WalletType.LEDGER ||
      activeWallet?.type === WalletType.LEDGER_LIVE
    )
      return 'ledger'
    return 'wallet'
  }, [activeWallet?.type])

  const priceChange = useMemo(() => {
    if (totalPriceChange !== 0)
      return {
        formattedPrice: valueChange24h,
        status: indicatorStatus,
        formattedPercent: percentChange24h
      }
    return undefined
  }, [totalPriceChange, valueChange24h, indicatorStatus, percentChange24h])

  const errorMessage = useMemo(() => {
    if (allBalancesInaccurate) {
      return 'Unable to load balances'
    }
    return undefined
  }, [allBalancesInaccurate])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: theme.colors.$surfacePrimary
        }}
        onLayout={handleStickyHeaderLayout}>
        <BalanceHeaderSection
          onLayout={handleBalanceHeaderLayout}
          animatedHeaderStyle={animatedHeaderStyle}
          onPress={openWalletsModal}
          walletName={walletName}
          walletIcon={walletIcon}
          accountName={activeAccount?.name}
          formattedBalance={formattedBalance}
          selectedCurrency={selectedCurrency}
          priceChange={priceChange}
          errorMessage={errorMessage}
          onErrorPress={handleErrorPress}
          isLoading={isLoading && balanceTotalInCurrency === 0}
          isLoadingBalances={isLoadingBalances || isLoading}
          isPrivacyModeEnabled={isPrivacyModeEnabled}
          isDeveloperMode={isDeveloperMode}
          renderMaskView={renderMaskView}
          backgroundColor={theme.colors.$surfacePrimary}
        />

        {filteredTokenList.length > 0 && (
          <ActionButtons
            buttons={actionButtons}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 20
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
    openWalletsModal,
    walletName,
    walletIcon,
    activeAccount?.name,
    formattedBalance,
    selectedCurrency,
    priceChange,
    errorMessage,
    handleErrorPress,
    isLoading,
    balanceTotalInCurrency,
    isLoadingBalances,
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
      handleScrollResync()
    }, [handleScrollResync])
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
