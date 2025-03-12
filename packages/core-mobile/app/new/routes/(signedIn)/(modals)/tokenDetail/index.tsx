import { noop } from '@avalabs/core-utils-sdk'
import {
  NavigationTitleHeader,
  SegmentedControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams } from 'expo-router'
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
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  SharedValue,
  useSharedValue
} from 'react-native-reanimated'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import {
  CollapsibleTabs,
  CollapsibleTabsRef
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

const TokenDetailScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const botomInset = useSafeAreaInsets().bottom
  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const { openUrl } = useInAppBrowser()
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

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: <NavigationTitleHeader title={token?.name ?? ''} />,
    targetLayout: tokenHeaderLayout
  })
  const selectedSegmentIndex = useSharedValue(0)

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.get()
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
      openUrl(explorerLink)
    },
    [openUrl]
  )

  const handleSelectSegment = (index: number): void => {
    if (tabViewRef.current?.getCurrentIndex() !== index) {
      tabViewRef.current?.setIndex(index)
    }
  }

  const handleChangeTab = (index: number): void => {
    selectedSegmentIndex.value = index
  }

  const handleScrollTab = (tabIndex: SharedValue<number>): void => {
    selectedSegmentIndex.value = tabIndex.value
  }

  const renderEmptyTabBar = (): JSX.Element => <></>

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: colors.$surfacePrimary,
          paddingHorizontal: 16
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
        <ActionButtons buttons={ACTION_BUTTONS} />
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
    token
  ])

  const renderTabs = useCallback(() => {
    if (isXpToken) {
      return [
        {
          tabName: TokenDetailTab.Tokens,
          component: <TokenDetail token={token} />
        },
        {
          tabName: TokenDetailTab.Activity,
          component: (
            <TransactionHistory
              token={token}
              handleExplorerLink={handleExplorerLink}
            />
          )
        }
      ]
    }
    return [
      {
        tabName: TokenDetailTab.Activity,
        component: (
          <TransactionHistory
            token={token}
            handleExplorerLink={handleExplorerLink}
          />
        )
      }
    ]
  }, [handleExplorerLink, isXpToken, token])

  return (
    <BlurredBarsContentLayout>
      <CollapsibleTabs.Container
        ref={tabViewRef}
        renderHeader={renderHeader}
        renderTabBar={renderEmptyTabBar}
        onIndexChange={handleChangeTab}
        onScrollY={onScroll}
        onScrollTab={handleScrollTab}
        tabs={renderTabs()}
      />
      {isXpToken && (
        <LinearGradientBottomWrapper>
          <SegmentedControl
            dynamicItemWidth={true}
            items={[TokenDetailTab.Tokens, TokenDetailTab.Activity]}
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

const ACTION_BUTTONS: ActionButton[] = [
  { title: ActionButtonTitle.Send, icon: 'send', onPress: noop },
  { title: ActionButtonTitle.Swap, icon: 'swap', onPress: noop },
  { title: ActionButtonTitle.Buy, icon: 'buy', onPress: noop },
  { title: ActionButtonTitle.Stake, icon: 'stake', onPress: noop },
  { title: ActionButtonTitle.Bridge, icon: 'bridge', onPress: noop },
  { title: ActionButtonTitle.Connect, icon: 'connect', onPress: noop }
]

export default TokenDetailScreen
