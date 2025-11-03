import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import {
  NavigationTitleHeader,
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
import { TokenHeader } from 'common/components/TokenHeader'
import {
  AVAX_TOKEN_ID,
  SOLANA_TOKEN_LOCAL_ID,
  USDC_AVALANCHE_C_TOKEN_ID,
  USDC_SOLANA_TOKEN_ID
} from 'common/consts/swap'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { getSourceChainId } from 'common/utils/bridgeUtils'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAssetBalances } from 'features/bridge/hooks/useAssetBalances'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import TokenDetail from 'features/portfolio/assets/components/TokenDetail'
import TransactionHistory from 'features/portfolio/assets/components/TransactionHistory'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { useSendSelectedToken } from 'features/send/store'
import { useAddStake } from 'features/stake/hooks/useAddStake'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { UI, useIsUIDisabledForNetwork } from 'hooks/useIsUIDisabled'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  AVAX_P_ID,
  selectIsBalancesAccurateByNetwork,
  selectIsLoadingBalances
} from 'store/balance'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useNetworks } from 'hooks/networks/useNetworks'
import { ChainId } from '@avalabs/core-chains-sdk'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'
import {
  selectIsBridgeBlocked,
  selectIsBridgeBtcBlocked,
  selectIsBridgeEthBlocked,
  selectIsMeldOfframpBlocked
} from 'store/posthog'
import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'

export const TokenDetailScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()
  const { getNetwork } = useNetworks()
  const { navigateToSwap } = useNavigateToSwap()
  const { addStake, canAddStake } = useAddStake()
  const botomInset = useSafeAreaInsets().bottom
  const tabViewRef = useRef<CollapsibleTabsRef>(null)
  const [_, setSelectedToken] = useSendSelectedToken()
  const [tokenHeaderLayout, setTokenHeaderLayout] = useState<
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
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens
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

  const isBalanceAccurate = useSelector(
    selectIsBalancesAccurateByNetwork(token?.networkChainId)
  )

  const isBalanceLoading = useSelector(selectIsLoadingBalances)

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setTokenHeaderLayout(event.nativeEvent.layout)
  }, [])

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
      return isBitcoinChainId(token?.networkChainId)
    }

    if (isBridgeEthBlocked && token?.networkChainId) {
      return isEthereumChainId(token?.networkChainId)
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
        onPress: () => navigateToSwap(fromTokenId, toTokenId)
      })
    }

    if (token && isBuyable(token)) {
      buttons.push({
        title: ActionButtonTitle.Buy,
        icon: 'buy',
        onPress: () => navigateToBuy({ token })
      })
    }

    if (isTokenStakable) {
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
    isMeldOfframpBlocked,
    isSwapDisabled,
    token,
    isBuyable,
    isTokenStakable,
    isBridgeDisabled,
    isTokenBridgeable,
    isWithdrawable,
    navigateToSwap,
    navigateToBuy,
    canAddStake,
    addStake,
    handleBridge,
    navigateToWithdraw
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
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: Platform.OS === 'ios' ? 16 : 0
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
              isPrivacyModeEnabled={isPrivacyModeEnabled}
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
    actionButtons,
    isPrivacyModeEnabled
  ])

  const tabs = useMemo(() => {
    const activityTab = {
      tabName: TokenDetailTab.Activity,
      component: (
        <TransactionHistory
          token={token}
          handleExplorerLink={handleExplorerLink}
          handlePendingBridge={handlePendingBridge}
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
  }, [handleExplorerLink, isXpToken, token, handlePendingBridge])

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

const SEGMENT_ITEMS = [
  { title: TokenDetailTab.Tokens },
  { title: TokenDetailTab.Activity }
]
