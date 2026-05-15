import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { ChainId } from '@avalabs/core-chains-sdk'
import {
  NavigationTitleHeader,
  SegmentedControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { TokenPriceChart } from 'common/components/chart/TokenPriceChart'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { TokenHeader } from 'common/components/TokenHeader'
import { tokenIds } from 'consts/tokenIds'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useHasXpAddresses } from 'common/hooks/useHasXpAddresses'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import TokenDetail from 'features/portfolio/assets/components/TokenDetail'
import TransactionHistory from 'features/portfolio/assets/components/TransactionHistory'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { useIsBalanceAccurateByNetwork } from 'features/portfolio/hooks/useIsBalanceAccurateByNetwork'
import { useIsLoadingBalancesForAccount } from 'features/portfolio/hooks/useIsLoadingBalancesForAccount'
import { useSendSelectedToken } from 'features/send/store'
import { useAddStake } from 'features/stake/hooks/useAddStake'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  LayoutRectangle,
  Platform,
  useWindowDimensions
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AVAX_P_ID } from 'services/balance/const'
import { selectActiveAccount } from 'store/account/slice'
import {
  selectIsFusionEnabled,
  selectIsMeldOfframpBlocked
} from 'store/posthog'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'

export const TokenDetailScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const hasXpAddresses = useHasXpAddresses()
  const { navigate } = useRouter()
  const { getNetwork } = useNetworks()
  const { navigateToSwap } = useNavigateToSwap()
  const { addStake, canAddStake } = useAddStake()
  const frame = useWindowDimensions()
  const headerHeight = useEffectiveHeaderHeight()
  const insets = useSafeAreaInsets()
  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const [_, setSelectedToken] = useSendSelectedToken()
  const [tokenHeaderLayout, setTokenHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [titleLayout, setTitleLayout] = useState<LayoutRectangle | undefined>()
  const [segmentedControlLayout, setSegmentedControlLayout] = useState<
    LayoutRectangle | undefined
  >()
  const isFusionEnabled = useSelector(selectIsFusionEnabled)
  const isMeldOfframpBlocked = useSelector(selectIsMeldOfframpBlocked)
  const { localId, chainId } = useLocalSearchParams<{
    localId: string
    chainId: string
  }>()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  const erc20ContractTokens = useErc20ContractTokens()
  // Keep zero balance tokens visible so the page doesn't crash after sending max balance
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: false
  })
  const { formatCurrency } = useFormatCurrency()

  const token = useMemo(() => {
    return filteredTokenList.find(
      tk => tk.localId === localId && tk.networkChainId === Number(chainId)
    )
  }, [chainId, filteredTokenList, localId])

  const { resolveMarketToken } = useWatchlist()
  const tokenCoingeckoId = useMemo(
    () =>
      token ? resolveMarketToken(token)?.coingeckoId ?? undefined : undefined,
    [token, resolveMarketToken]
  )

  const isXpToken =
    token && (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token))

  const selectedCurrency = useSelector(selectSelectedCurrency)

  const activeAccount = useSelector(selectActiveAccount)

  const isBalanceAccurate = useIsBalanceAccurateByNetwork(
    activeAccount,
    token?.networkChainId
  )

  const isBalanceLoading = useIsLoadingBalancesForAccount(
    activeAccount,
    token?.networkChainId
  )

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setTokenHeaderLayout(event.nativeEvent.layout)
  }, [])

  const handleTitleLayout = useCallback((event: LayoutChangeEvent): void => {
    setTitleLayout(event.nativeEvent.layout)
  }, [])

  const handleSegmentedControlLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setSegmentedControlLayout(event.nativeEvent.layout)
    },
    []
  )

  const tokenName = token?.name ?? ''

  const { navigateToBuy, isBuyable } = useBuy()
  const { navigateToWithdraw, isWithdrawable } = useWithdraw()

  const header = useMemo(
    () => <NavigationTitleHeader title={tokenName} />,
    [tokenName]
  )

  const isTokenStakable = useMemo(
    () =>
      (token?.networkChainId === ChainId.AVALANCHE_MAINNET_ID &&
        token?.localId.toLowerCase() === tokenIds.AVAX.toLowerCase()) ||
      (token?.networkChainId === ChainId.AVALANCHE_TESTNET_ID &&
        token?.localId.toLowerCase() === tokenIds.AVAX.toLowerCase()) ||
      (token?.networkChainId === ChainId.AVALANCHE_P &&
        token?.localId.toLowerCase() === AVAX_P_ID.toLowerCase()) ||
      (token?.networkChainId === ChainId.AVALANCHE_TEST_P &&
        token?.localId.toLowerCase() === AVAX_P_ID.toLowerCase()),
    [token]
  )

  const isSwapUIDisabledForNetwork = useMemo(() => {
    // Swap is not supported on X/P chains
    return (
      token?.networkChainId === ChainId.AVALANCHE_X ||
      token?.networkChainId === ChainId.AVALANCHE_TEST_X ||
      token?.networkChainId === ChainId.AVALANCHE_P ||
      token?.networkChainId === ChainId.AVALANCHE_TEST_P
    )
  }, [token?.networkChainId])

  const handleSend = useCallback((): void => {
    setSelectedToken(token)
    navigate({
      // @ts-ignore we need to navigate to modal root so _layout.tsx can decide between onboarding/recentContacts
      pathname: '/send',
      params: { vmName: getNetwork(token?.networkChainId)?.vmName }
    })
  }, [getNetwork, navigate, setSelectedToken, token])

  const actionButtons: ActionButton[] = useMemo(() => {
    const buttons: ActionButton[] = [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: handleSend }
    ]

    if (isFusionEnabled && !isSwapUIDisabledForNetwork) {
      const fromTokenId = token?.internalId ?? token?.localId
      const fromCaip2Id = getNetwork(token?.networkChainId)?.caip2ChainId
      const toCaip2Id = fromCaip2Id

      buttons.push({
        title: ActionButtonTitle.Swap,
        icon: 'swap',
        onPress: () => navigateToSwap({ fromTokenId, fromCaip2Id, toCaip2Id })
      })
    }

    if (token && isBuyable(token)) {
      buttons.push({
        title: ActionButtonTitle.Buy,
        icon: 'buy',
        onPress: () => navigateToBuy({ token })
      })
    }

    if (isTokenStakable && hasXpAddresses) {
      buttons.push({
        title: ActionButtonTitle.Stake,
        icon: 'stake',
        disabled: !canAddStake,
        onPress: addStake
      })
    }

    if (token && isWithdrawable(token) && !isMeldOfframpBlocked) {
      buttons.push({
        title: ActionButtonTitle.Withdraw,
        icon: 'withdraw',
        onPress: () => navigateToWithdraw({ token })
      })
    }

    return buttons
  }, [
    handleSend,
    token,
    isBuyable,
    isTokenStakable,
    hasXpAddresses,
    isWithdrawable,
    isFusionEnabled,
    isMeldOfframpBlocked,
    navigateToSwap,
    navigateToBuy,
    canAddStake,
    addStake,
    navigateToWithdraw,
    getNetwork,
    isSwapUIDisabledForNetwork
  ])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: header,
    targetLayout: titleLayout
  })
  const selectedSegmentIndex = useSharedValue(0)

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const formattedBalance = useMemo(() => {
    if (token?.balanceInCurrency === undefined || token.balanceInCurrency === 0)
      return UNKNOWN_AMOUNT
    return formatCurrency({
      amount: token?.balanceInCurrency,
      withoutCurrencySuffix: true
    })
  }, [token?.balanceInCurrency, formatCurrency])

  const { openUrl } = useInAppBrowser()

  const handleExplorerLink = useCallback(
    (
      explorerLink: string,
      hash?: string,
      hashType?: 'account' | 'tx'
    ): void => {
      AnalyticsService.capture('ExplorerLinkClicked')
      const url = getExplorerAddressByNetwork(explorerLink, hash, hashType)
      openUrl(url)
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
    if (!token) return <></>

    return (
      <View
        style={{
          backgroundColor: colors.$surfacePrimary,
          paddingTop: Platform.OS === 'ios' ? 12 : 0
        }}
        onLayout={handleHeaderLayout}>
        <View
          onLayout={handleTitleLayout}
          style={{
            paddingHorizontal: 16
          }}>
          <Animated.View
            style={[
              {
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
              isPrivacyModeEnabled={isPrivacyModeEnabled}
            />
          </Animated.View>
        </View>
        <ActionButtons
          buttons={actionButtons}
          contentContainerStyle={{
            padding: 16
          }}
        />
        <View testID="token-detail-chart-slot">
          <TokenPriceChart
            symbol={token?.symbol ?? ''}
            coingeckoId={tokenCoingeckoId}
            width={frame.width}
          />
        </View>
      </View>
    )
  }, [
    token,
    colors.$surfacePrimary,
    handleHeaderLayout,
    handleTitleLayout,
    animatedHeaderStyle,
    formattedBalance,
    selectedCurrency,
    isBalanceAccurate,
    isBalanceLoading,
    isPrivacyModeEnabled,
    actionButtons,
    frame.width,
    tokenCoingeckoId
  ])

  const tabHeight = useMemo(() => {
    return Platform.select({
      ios: frame.height - headerHeight,
      android: frame.height - headerHeight + (tokenHeaderLayout?.height ?? 0)
    })
  }, [frame.height, headerHeight, tokenHeaderLayout?.height])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingBottom: (segmentedControlLayout?.height ?? 0) + 32,
      minHeight: tabHeight
    }
  }, [segmentedControlLayout?.height, tabHeight])

  const tabs = useMemo(() => {
    const activityTab = {
      tabName: TokenDetailTab.Activity,
      component: (
        <TransactionHistory
          token={token}
          handleExplorerLink={handleExplorerLink}
          containerStyle={contentContainerStyle}
        />
      )
    }

    return isXpToken
      ? [
          {
            tabName: TokenDetailTab.Assets,
            component: <TokenDetail token={token} />
          },
          activityTab
        ]
      : [activityTab]
  }, [token, handleExplorerLink, contentContainerStyle, isXpToken])

  const renderSegmentedControl = useCallback((): JSX.Element => {
    return (
      <LinearGradientBottomWrapper>
        <SegmentedControl
          dynamicItemWidth={false}
          items={SEGMENT_ITEMS}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={handleSelectSegment}
          style={{ marginHorizontal: 16, marginBottom: insets.bottom }}
        />
      </LinearGradientBottomWrapper>
    )
  }, [handleSelectSegment, selectedSegmentIndex, insets.bottom])

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
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0
          }}
          onLayout={handleSegmentedControlLayout}>
          {renderSegmentedControl()}
        </View>
      )}
      {/* 
        This is a workaround to display the header background + separator on Android.
        Android returns a header height of 0, so we need to display the background + separator manually.
      */}
      {Platform.OS === 'android' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: headerHeight
          }}>
          <BlurredBackgroundView
            separator={{ opacity: targetHiddenProgress, position: 'bottom' }}
          />
        </View>
      )}
    </BlurredBarsContentLayout>
  )
}

export enum TokenDetailTab {
  Assets = 'Assets',
  Activity = 'Activity'
}

const SEGMENT_ITEMS = [
  { title: TokenDetailTab.Assets },
  { title: TokenDetailTab.Activity }
]
