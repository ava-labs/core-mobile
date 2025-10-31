import {
  NavigationTitleHeader,
  SegmentedControl,
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
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useBuy } from 'features/meld/hooks/useBuy'
import AssetsScreen from 'features/portfolio/assets/components/AssetsScreen'
import { CollectibleFilterAndSortInitialState } from 'features/portfolio/collectibles/hooks/useCollectiblesFilterAndSort'
import { CollectiblesScreen } from 'features/portfolio/collectibles/screens/CollectiblesScreen'
import { DeFiScreen } from 'features/portfolio/defi/components/DeFiScreen'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform
} from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AnalyticsEventName } from 'services/analytics/types'
import { selectActiveAccount } from 'store/account'
import { LocalTokenWithBalance } from 'store/balance'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { PortfolioHeader } from '../assets/components/PortfolioHeader'
import { usePortfolioHeader } from '../assets/hooks/usePortfolioHeader'

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

  const { navigateToBuy } = useBuy()
  const isPrivacyModeEnabled = useFocusedSelector(selectIsPrivacyModeEnabled)
  const { navigate, push } = useRouter()

  const [stickyHeaderLayout, setStickyHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()
  const selectedSegmentIndex = useSharedValue(0)
  const activeAccount = useFocusedSelector(selectActiveAccount)

  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const {
    formattedBalance,
    balanceAccurate,
    isLoading,
    formattedPriceChange,
    totalPriceChanged,
    indicatorStatus,
    formattedPercent
  } = usePortfolioHeader()

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

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
        renderHeader={() => (
          <PortfolioHeader
            targetHiddenProgress={targetHiddenProgress}
            setStickyHeaderLayout={setStickyHeaderLayout}
            setBalanceHeaderLayout={setBalanceHeaderLayout}
            totalPriceChanged={totalPriceChanged}
            formattedBalance={formattedBalance}
            isLoading={isLoading}
            balanceAccurate={balanceAccurate}
            formattedPriceChange={formattedPriceChange}
            indicatorStatus={indicatorStatus}
            formattedPercent={formattedPercent}
          />
        )}
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
