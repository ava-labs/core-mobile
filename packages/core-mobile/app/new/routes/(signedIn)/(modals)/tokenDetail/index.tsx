import { noop } from '@avalabs/core-utils-sdk'
import {
  NavigationTitleHeader,
  SegmentedControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsBalancesAccurateByNetwork,
  selectIsLoadingBalances
} from 'store/balance'
import { selectSelectedCurrency } from 'store/settings/currency'
import { formatCurrency } from 'utils/FormatCurrency'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  InteractionManager
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { TokenHeader } from 'common/components/TokenHeader'
import TransactionHistory from 'features/portfolio/assets/components/TransactionHistory'
import TokenDetail from 'features/portfolio/assets/components/TokenDetail'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { useAssetBalances } from 'screens/bridge/hooks/useAssetBalances'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'

const TokenDetailScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()
  const botomInset = useSafeAreaInsets().bottom
  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const { openUrl } = useCoreBrowser()
  const [tokenHeaderLayout, setTokenHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const { localId } = useLocalSearchParams<{
    localId: string
  }>()

  const { filteredTokenList } = useSearchableTokenList({})

  const token = useMemo(() => {
    return filteredTokenList.find(tk => tk.localId === localId)
  }, [filteredTokenList, localId])

  const isXpToken =
    token && (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token))

  const selectedCurrency = useSelector(selectSelectedCurrency)

  const isBalanceAccurate = useSelector(
    selectIsBalancesAccurateByNetwork(token?.networkChainId)
  )

  const isBalanceLoading = useSelector(selectIsLoadingBalances)

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setTokenHeaderLayout(event.nativeEvent.layout)
  }, [])

  const tokenName = token?.name ?? ''

  const header = useMemo(
    () => <NavigationTitleHeader title={tokenName} />,
    [tokenName]
  )

  const isSwapDisabled = useIsUIDisabled(UI.Swap)
  const isBridgeDisabled = useIsUIDisabled(UI.Bridge)
  const { assetsWithBalances } = useAssetBalances()
  const isTokenBridgeable = Boolean(
    assetsWithBalances &&
      assetsWithBalances.some(
        asset => (asset.symbolOnNetwork ?? asset.symbol) === token?.symbol
      )
  )

  const handleBridge = useCallback(() => {
    navigate({
      pathname: '/bridge',
      params: token
        ? {
            initialSourceNetworkChainId: token.networkChainId,
            initialTokenSymbol: token.symbol
          }
        : undefined
    })
  }, [navigate, token])

  const handleBuy = useCallback(() => {
    navigate({
      pathname: '/buy'
    })
  }, [navigate])

  const actionButtons: ActionButton[] = useMemo(() => {
    const buttons: ActionButton[] = [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: noop }
    ]

    if (!isSwapDisabled) {
      buttons.push({
        title: ActionButtonTitle.Swap,
        icon: 'swap',
        onPress: noop
      })
    }

    buttons.push({
      title: ActionButtonTitle.Buy,
      icon: 'buy',
      onPress: handleBuy
    })

    buttons.push({
      title: ActionButtonTitle.Stake,
      icon: 'stake',
      onPress: noop
    })

    if (!isBridgeDisabled && isTokenBridgeable) {
      buttons.push({
        title: ActionButtonTitle.Bridge,
        icon: 'bridge',
        onPress: handleBridge
      })
    }

    return buttons
  }, [
    isSwapDisabled,
    isBridgeDisabled,
    isTokenBridgeable,
    handleBridge,
    handleBuy
  ])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: header,
    targetLayout: tokenHeaderLayout
  })
  const selectedSegmentIndex = useSharedValue(0)

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const formattedBalance = useMemo(() => {
    if (token?.balanceInCurrency === undefined) return UNKNOWN_AMOUNT
    return formatCurrency({
      boostSmallNumberPrecision: false,
      amount: token?.balanceInCurrency,
      currency: selectedCurrency
    })
  }, [selectedCurrency, token?.balanceInCurrency])

  const handleExplorerLink = useCallback(
    (explorerLink: string): void => {
      AnalyticsService.capture('ActivityCardLinkClicked')
      openUrl({ url: explorerLink, title: '' })
    },
    [openUrl]
  )

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

  const renderEmptyTabBar = useCallback((): JSX.Element => <></>, [])

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: colors.$surfacePrimary,
          paddingHorizontal: 16,
          paddingBottom: 16
        }}>
        <View onLayout={handleHeaderLayout}>
          <Animated.View
            style={[
              {
                paddingBottom: 16,
                backgroundColor: colors.$surfacePrimary
              },
              animatedHeaderStyle
            ]}>
            <TokenHeader
              token={token}
              formattedBalance={formattedBalance}
              currency={selectedCurrency}
              errorMessage={
                isBalanceAccurate ? undefined : 'Unable to load all balances'
              }
              isLoading={isBalanceLoading}
            />
          </Animated.View>
        </View>
        <ActionButtons buttons={actionButtons} />
      </View>
    )
  }, [
    animatedHeaderStyle,
    colors.$surfacePrimary,
    formattedBalance,
    handleHeaderLayout,
    isBalanceAccurate,
    isBalanceLoading,
    selectedCurrency,
    token,
    actionButtons
  ])

  const tabs = useMemo(() => {
    const activityTab = {
      tabName: TokenDetailTab.Activity,
      component: (
        <TransactionHistory
          token={token}
          handleExplorerLink={handleExplorerLink}
        />
      )
    }

    return isXpToken
      ? [
          {
            tabName: TokenDetailTab.Tokens,
            component: <TokenDetail token={token} />
          },
          activityTab
        ]
      : [activityTab]
  }, [handleExplorerLink, isXpToken, token])

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
      {isXpToken && (
        <LinearGradientBottomWrapper>
          <SegmentedControl
            dynamicItemWidth={false}
            items={SEGMENT_ITEMS}
            selectedSegmentIndex={selectedSegmentIndex}
            onSelectSegment={handleSelectSegment}
            style={{ marginHorizontal: 16, marginBottom: botomInset }}
          />
        </LinearGradientBottomWrapper>
      )}
    </BlurredBarsContentLayout>
  )
}

export enum TokenDetailTab {
  Tokens = 'Tokens',
  Activity = 'Activity'
}

const SEGMENT_ITEMS = [TokenDetailTab.Tokens, TokenDetailTab.Activity]

export default TokenDetailScreen
