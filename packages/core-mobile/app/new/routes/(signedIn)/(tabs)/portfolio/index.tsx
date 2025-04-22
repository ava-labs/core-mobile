import { noop } from '@avalabs/core-utils-sdk'
import {
  BalanceHeader,
  NavigationTitleHeader,
  PriceChangeStatus,
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
import { useAddStake } from 'features/stake/hooks/useAddStake'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import React, { useCallback, useMemo, useRef, useState } from 'react'
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
import { useSendSelectedToken } from 'features/send/store'

const SEGMENT_ITEMS = ['Assets', 'Collectibles', 'DeFi']

const PortfolioHomeScreen = (): JSX.Element => {
  const isPrivacyModeEnabled = useFocusedSelector(selectIsPrivacyModeEnabled)
  const { theme } = useTheme()
  const { navigate } = useRouter()
  const { addStake, canAddStake } = useAddStake()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [_, setSelectedToken] = useSendSelectedToken()
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
    return !balanceAccurate || balanceTotalInCurrency === 0
      ? '$' + UNKNOWN_AMOUNT
      : formatCurrency({ amount: balanceTotalInCurrency })
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

  const handleSend = useCallback((): void => {
    setSelectedToken(undefined)
    navigate('/send')
  }, [navigate, setSelectedToken])

  const handleSwap = useCallback((): void => {
    navigate('/swap')
  }, [navigate])

  const handleConnect = useCallback((): void => {
    navigate('/walletConnectScan')
  }, [navigate])

  const handleBuy = useCallback((): void => {
    navigate({ pathname: '/buy' })
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

  const ACTION_BUTTONS: ActionButton[] = useMemo(
    () => [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: handleSend },
      { title: ActionButtonTitle.Swap, icon: 'swap', onPress: handleSwap },
      { title: ActionButtonTitle.Buy, icon: 'buy', onPress: handleBuy },
      {
        title: ActionButtonTitle.Stake,
        icon: 'stake',
        onPress: addStake,
        disabled: !canAddStake
      },
      { title: ActionButtonTitle.Bridge, icon: 'bridge', onPress: noop },
      {
        title: ActionButtonTitle.Connect,
        icon: 'connect',
        onPress: handleConnect
      }
    ],
    [addStake, canAddStake, handleBuy, handleConnect, handleSend, handleSwap]
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
              priceChange={
                totalPriceChanged > 0
                  ? {
                      formattedPrice: `$${Math.abs(totalPriceChanged).toFixed(
                        2
                      )}`,
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

  const handleGoToDiscoverCollectibles = useCallback((): void => {
    navigate({
      pathname: '/discoverCollectibles'
    })
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
            goToDiscoverCollectibles={handleGoToDiscoverCollectibles}
          />
        )
      },
      {
        tabName: 'DeFi',
        component: <DeFiScreen />
      }
    ]
  }, [
    handleGoToTokenDetail,
    handleGoToTokenManagement,
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
