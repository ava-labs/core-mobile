import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { ChainId } from '@avalabs/core-chains-sdk'
import {
  NavigationTitleHeader,
  SegmentedControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  CollapsibleTabs,
  CollapsibleTabsRef,
  OnTabChange
} from 'common/components/CollapsibleTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { TokenHeader } from 'common/components/TokenHeader'
import {
  AVAX_TOKEN_ID,
  SOLANA_TOKEN_LOCAL_ID,
  USDC_AVALANCHE_C_TOKEN_ID,
  USDC_SOLANA_TOKEN_ID
} from 'common/consts/swap'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useHasXpAddresses } from 'common/hooks/useHasXpAddresses'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { getSourceChainId } from 'common/utils/bridgeUtils'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAssetBalances } from 'features/bridge/hooks/useAssetBalances'
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
import { UI, useIsUIDisabledForNetwork } from 'hooks/useIsUIDisabled'
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
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { selectActiveAccount } from 'store/account/slice'
import {
  selectIsBridgeBlocked,
  selectIsBridgeBtcBlocked,
  selectIsBridgeEthBlocked,
  selectIsMeldOfframpBlocked
} from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'

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
  const isMeldOfframpBlocked = useSelector(selectIsMeldOfframpBlocked)
  const { localId, chainId } = useLocalSearchParams<{
    localId: string
    chainId: string
  }>()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
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

  const isSwapDisabled = useIsUIDisabledForNetwork(
    UI.Swap,
    token?.networkChainId
  )
  const isBridgeBlocked = useSelector(selectIsBridgeBlocked)
  const isBridgeBtcBlocked = useSelector(selectIsBridgeBtcBlocked)
  const isBridgeEthBlocked = useSelector(selectIsBridgeEthBlocked)
  const isBridgeUIDisabledForNetwork = useIsUIDisabledForNetwork(
    UI.Bridge,
    token?.networkChainId
  )

  const isBridgeDisabled = useMemo(() => {
    if (isBridgeBtcBlocked && token?.networkChainId) {
      return isBitcoinChainId(token.networkChainId)
    }

    if (isBridgeEthBlocked && token?.networkChainId) {
      return isEthereumChainId(token.networkChainId)
    }

    return isBridgeUIDisabledForNetwork || isBridgeBlocked
  }, [
    token?.networkChainId,
    isBridgeUIDisabledForNetwork,
    isBridgeBlocked,
    isBridgeBtcBlocked,
    isBridgeEthBlocked
  ])
  const { assetsWithBalances } = useAssetBalances(token?.networkChainId)
  const isTokenBridgeable = Boolean(
    assetsWithBalances &&
      assetsWithBalances.some(
        asset => (asset.symbolOnNetwork ?? asset.symbol) === token?.symbol
      )
  )

  const isTokenStakable = useMemo(
    () =>
      (token?.networkChainId === ChainId.AVALANCHE_MAINNET_ID &&
        token?.localId === AVAX_TOKEN_ID) ||
      (token?.networkChainId === ChainId.AVALANCHE_TESTNET_ID &&
        token?.localId === AVAX_TOKEN_ID) ||
      (token?.networkChainId === ChainId.AVALANCHE_P &&
        token?.localId === AVAX_P_ID) ||
      (token?.networkChainId === ChainId.AVALANCHE_TEST_P &&
        token?.localId === AVAX_P_ID),
    [token]
  )

  const handleBridge = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/bridge',
      params: token
        ? {
            initialSourceNetworkChainId: token.networkChainId,
            initialTokenSymbol: token.symbol
          }
        : undefined
    })
  }, [navigate, token])

  const handleSend = useCallback((): void => {
    setSelectedToken(token)
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/send',
      params: { vmName: getNetwork(token?.networkChainId)?.vmName }
    })
  }, [getNetwork, navigate, setSelectedToken, token])

  const actionButtons: ActionButton[] = useMemo(() => {
    const buttons: ActionButton[] = [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: handleSend }
    ]

    if (!isSwapDisabled) {
      const fromTokenId = token?.localId

      let toTokenId: string | undefined

      switch (fromTokenId) {
        case AVAX_TOKEN_ID:
          toTokenId = USDC_AVALANCHE_C_TOKEN_ID
          break
        case USDC_AVALANCHE_C_TOKEN_ID:
          toTokenId = AVAX_TOKEN_ID
          break
        case SOLANA_TOKEN_LOCAL_ID:
          toTokenId = USDC_SOLANA_TOKEN_ID
          break
        case USDC_SOLANA_TOKEN_ID:
          toTokenId = SOLANA_TOKEN_LOCAL_ID
          break
        default:
          toTokenId = AVAX_TOKEN_ID
      }

      buttons.push({
        title: ActionButtonTitle.Swap,
        icon: 'swap',
        onPress: () => navigateToSwap({ fromTokenId, toTokenId })
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

    if (!isBridgeDisabled && isTokenBridgeable) {
      buttons.push({
        title: ActionButtonTitle.Bridge,
        icon: 'bridge',
        onPress: handleBridge
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
    isSwapDisabled,
    token,
    isBuyable,
    isTokenStakable,
    hasXpAddresses,
    isBridgeDisabled,
    isTokenBridgeable,
    isWithdrawable,
    isMeldOfframpBlocked,
    navigateToSwap,
    navigateToBuy,
    canAddStake,
    addStake,
    handleBridge,
    navigateToWithdraw
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

  const handlePendingBridge = useCallback(
    (pendingBridge: BridgeTransaction | BridgeTransfer): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/bridgeStatus',
        params: {
          txHash: pendingBridge.sourceTxHash,
          chainId: getSourceChainId(pendingBridge, isDeveloperMode)
        }
      })
    },
    [navigate, isDeveloperMode]
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
        {/* TODO: add after design is finalized */}
        {/* <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <TokenPriceCard token={token} />
        </View> */}
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
    actionButtons
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
          handlePendingBridge={handlePendingBridge}
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
  }, [
    token,
    handleExplorerLink,
    handlePendingBridge,
    contentContainerStyle,
    isXpToken
  ])

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
