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
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useRouter } from 'expo-router'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import AssetsScreen from 'features/portfolio/assets/components/AssetsScreen'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { CollectiblesScreen } from 'features/portfolio/collectibles/components/CollectiblesScreen'
import { CollectibleFilterAndSortInitialState } from 'features/portfolio/collectibles/hooks/useCollectiblesFilterAndSort'
import { DeFiScreen } from 'features/portfolio/defi/components/DeFiScreen'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  StyleSheet,
  InteractionManager
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
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
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'

const SEGMENT_ITEMS = ['Assets', 'Collectibles', 'DeFi']

const PortfolioHomeScreen = (): JSX.Element => {
  const isPrivacyModeEnabled = useFocusedSelector(selectIsPrivacyModeEnabled)
  const { theme } = useTheme()
  const { navigate } = useRouter()
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
  const isLoading = isBalanceLoading || isRefetchingBalance
  const balanceAccurate = useFocusedSelector(
    selectBalanceForAccountIsAccurate(activeAccount?.index ?? 0)
  )
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { formatCurrency } = useFormatCurrency()
  const currencyBalance = useMemo(() => {
    return !balanceAccurate && balanceTotalInCurrency === 0
      ? '$' + UNKNOWN_AMOUNT
      : formatCurrency(balanceTotalInCurrency)
  }, [balanceAccurate, balanceTotalInCurrency, formatCurrency])

  const formattedBalance = useMemo(
    () => currencyBalance.replace(selectedCurrency, ''),
    [currencyBalance, selectedCurrency]
  )

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

  const handleStake = useCallback((): void => {
    navigate({ pathname: '/startStake' })
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
    targetLayout: balanceHeaderLayout
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const ACTION_BUTTONS: ActionButton[] = useMemo(
    () => [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: noop },
      { title: ActionButtonTitle.Swap, icon: 'swap', onPress: noop },
      { title: ActionButtonTitle.Buy, icon: 'buy', onPress: noop },
      { title: ActionButtonTitle.Stake, icon: 'stake', onPress: handleStake },
      { title: ActionButtonTitle.Bridge, icon: 'bridge', onPress: noop },
      { title: ActionButtonTitle.Connect, icon: 'connect', onPress: noop }
    ],
    [handleStake]
  )

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: theme.colors.$surfacePrimary,
          paddingHorizontal: 16,
          paddingBottom: 16
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
              isDeveloperModeEnabled={isDeveloperMode}
            />
          </Animated.View>
        </View>
        <ActionButtons buttons={ACTION_BUTTONS} />
      </View>
    )
  }, [
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
    ACTION_BUTTONS
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
    (localId: string): void => {
      navigate({ pathname: '/tokenDetail', params: { localId } })
    },
    [navigate]
  )

  const handleGoToTokenManagement = useCallback((): void => {
    navigate('/tokenManagement')
  }, [navigate])

  const handleGoToCollectibleDetail = useCallback(
    (localId: string, initial: CollectibleFilterAndSortInitialState): void => {
      navigate({
        pathname: '/collectibleDetail',
        params: { localId, initial: JSON.stringify(initial) }
      })
    },
    [navigate]
  )

  const handleGoToCollectibleManagement = useCallback((): void => {
    navigate('/collectibleManagement')
  }, [navigate])

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  const tabViewRef = useRef<CollapsibleTabsRef>(null)

  const tabs = useMemo(() => {
    return [
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
    ]
  }, [
    handleGoToCollectibleDetail,
    handleGoToTokenDetail,
    handleGoToTokenManagement,
    handleGoToCollectibleManagement
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
      <LinearGradientBottomWrapper>
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
