import { ChainId } from '@avalabs/core-chains-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useHasXpAddresses } from 'common/hooks/useHasXpAddresses'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { useMarketToken } from 'common/hooks/useMarketToken'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { caip2ChainIds } from 'consts/caip2ChainIds'
import { tokenIds } from 'consts/tokenIds'
import { useRouter } from 'expo-router'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'
import { ActionButton } from 'features/portfolio/assets/components/ActionButtons'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { useIsBalanceAccurateByNetwork } from 'features/portfolio/hooks/useIsBalanceAccurateByNetwork'
import { useIsLoadingBalancesForAccount } from 'features/portfolio/hooks/useIsLoadingBalancesForAccount'
import { useSendSelectedToken } from 'features/send/store'
import { useAddStake } from 'features/stake/hooks/useAddStake'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AVAX_P_ID, AVAX_X_ID } from 'services/balance/const'
import { selectActiveAccount } from 'store/account/slice'
import { LocalTokenWithBalance } from 'store/balance'
import {
  selectIsFusionAvalancheCctEnabled,
  selectIsFusionEnabled,
  selectIsMeldOfframpBlocked,
  selectIsPriceChartBlocked
} from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'
import { TokenActivity, useTokenActivity } from './useTokenActivity'

type HandleExplorerLink = (
  explorerLink: string,
  hash?: string,
  hashType?: 'account' | 'tx'
) => void

export type TokenDetailData = {
  formattedBalance: string
  selectedCurrency: string
  isBalanceAccurate: boolean
  isBalanceLoading: boolean
  isPrivacyModeEnabled: boolean
  isPriceChartBlocked: boolean
  actionButtons: ActionButton[]
  handleExplorerLink: HandleExplorerLink
  trackTokenId: string | undefined
  handleOpenTrackTokenDetail: () => void
  activity: TokenActivity
}

export const useTokenDetailData = (
  token: LocalTokenWithBalance | undefined
): TokenDetailData => {
  const { openUrl } = useInAppBrowser()
  const { navigate } = useRouter()
  const { getNetwork } = useNetworks()
  const { navigateToSwap } = useNavigateToSwap()
  const { addStake, canAddStake } = useAddStake()
  const { navigateToBuy, isBuyable } = useBuy()
  const { navigateToWithdraw, isWithdrawable } = useWithdraw()
  const { formatCurrency } = useFormatCurrency()
  const hasXpAddresses = useHasXpAddresses()
  const [, setSelectedToken] = useSendSelectedToken()

  const isFusionEnabled = useSelector(selectIsFusionEnabled)
  const isCctEnabled = useSelector(selectIsFusionAvalancheCctEnabled)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isMeldOfframpBlocked = useSelector(selectIsMeldOfframpBlocked)
  const isPriceChartBlocked = useSelector(selectIsPriceChartBlocked)
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
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

  const marketToken = useMarketToken({ token })
  const trackTokenId = marketToken?.id

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

  // X/P chains can only swap native AVAX, and only via Avalanche CCT — which
  // requires the CCT flag and the wallet's X/P addresses. Non-AVAX X-chain
  // assets (ANTs) aren't routable, so they keep no Swap button.
  const isXpAvaxToken = useMemo(() => {
    const chainId = token?.networkChainId
    const localId = token?.localId.toLowerCase()
    const isXChainAvax =
      (chainId === ChainId.AVALANCHE_X ||
        chainId === ChainId.AVALANCHE_TEST_X) &&
      localId === AVAX_X_ID.toLowerCase()
    const isPChainAvax =
      (chainId === ChainId.AVALANCHE_P ||
        chainId === ChainId.AVALANCHE_TEST_P) &&
      localId === AVAX_P_ID.toLowerCase()
    return isXChainAvax || isPChainAvax
  }, [token?.networkChainId, token?.localId])

  const isXpNetwork = useMemo(
    () =>
      token?.networkChainId === ChainId.AVALANCHE_X ||
      token?.networkChainId === ChainId.AVALANCHE_TEST_X ||
      token?.networkChainId === ChainId.AVALANCHE_P ||
      token?.networkChainId === ChainId.AVALANCHE_TEST_P,
    [token?.networkChainId]
  )

  // Swap on X/P is gated behind CCT availability + native AVAX + X/P addresses.
  const isSwapUIDisabledForNetwork = useMemo(
    () => isXpNetwork && !(isXpAvaxToken && isCctEnabled && hasXpAddresses),
    [isXpNetwork, isXpAvaxToken, isCctEnabled, hasXpAddresses]
  )

  const formattedBalance = useMemo(() => {
    if (
      token?.balanceInCurrency === undefined ||
      token.balanceInCurrency === 0
    ) {
      return UNKNOWN_AMOUNT
    }
    return formatCurrency({
      amount: token.balanceInCurrency,
      withoutCurrencySuffix: true
    })
  }, [token?.balanceInCurrency, formatCurrency])

  const handleExplorerLink = useCallback<HandleExplorerLink>(
    (explorerLink, hash, hashType) => {
      AnalyticsService.capture('ExplorerLinkClicked')
      const url = getExplorerAddressByNetwork(explorerLink, hash, hashType)
      openUrl(url)
    },
    [openUrl]
  )

  const handleOpenTrackTokenDetail = useCallback(() => {
    if (!trackTokenId) return
    navigate({
      // @ts-ignore route is defined under (modals)/trackTokenDetail
      pathname: '/trackTokenDetail',
      params: { tokenId: trackTokenId }
    })
  }, [navigate, trackTokenId])

  const handleSend = useCallback(() => {
    setSelectedToken(token)
    navigate({
      // @ts-ignore we need to navigate to modal root so _layout.tsx can decide between onboarding/recentContacts
      pathname: '/send',
      params: { vmName: getNetwork(token?.networkChainId)?.vmName }
    })
  }, [getNetwork, navigate, setSelectedToken, token])

  // Swap navigation params. CCT is cross-chain: defaulting an X/P source back
  // to its own chain would be a dead end, so send the user to C-Chain AVAX
  // (Fuji on testnet) — the canonical P/X → C route. C-Chain (and other EVM)
  // sources keep their same-chain default and let the user pick the to-token.
  const swapNavParams = useMemo(() => {
    const fromCaip2Id = getNetwork(token?.networkChainId)?.caip2ChainId
    const cChainCaip2Id = isDeveloperMode
      ? caip2ChainIds.FUJI
      : caip2ChainIds.C_CHAIN
    return {
      fromTokenId: token?.internalId ?? token?.localId,
      fromCaip2Id,
      toTokenId: isXpNetwork ? tokenIds.AVAX : undefined,
      toCaip2Id: isXpNetwork ? cChainCaip2Id : fromCaip2Id
    }
  }, [
    token?.internalId,
    token?.localId,
    token?.networkChainId,
    getNetwork,
    isDeveloperMode,
    isXpNetwork
  ])

  const actionButtons = useMemo<ActionButton[]>(() => {
    // No buttons until the token has resolved — Swap/Send would otherwise
    // navigate with undefined `fromTokenId` / `fromCaip2Id`.
    if (!token) return []

    const buttons: ActionButton[] = [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: handleSend }
    ]

    if (isFusionEnabled && !isSwapUIDisabledForNetwork) {
      buttons.push({
        title: ActionButtonTitle.Swap,
        icon: 'swap',
        onPress: () => navigateToSwap(swapNavParams)
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
    isSwapUIDisabledForNetwork,
    swapNavParams
  ])

  const activityRaw = useTokenActivity({ token, handleExplorerLink })

  const queryClient = useQueryClient()
  const { refetch: refetchBalances, isRefetching: isRefetchingBalances } =
    useAccountBalances(activeAccount)

  const refreshAll = useCallback(() => {
    activityRaw.refresh()
    refetchBalances()
    queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.TOKEN_CHART_DATA]
    })
  }, [activityRaw, refetchBalances, queryClient])

  const activity = useMemo<TokenActivity>(
    () => ({
      ...activityRaw,
      refresh: refreshAll,
      isRefreshing: activityRaw.isRefreshing || isRefetchingBalances
    }),
    [activityRaw, refreshAll, isRefetchingBalances]
  )

  return {
    formattedBalance,
    selectedCurrency,
    isBalanceAccurate,
    isBalanceLoading,
    isPrivacyModeEnabled,
    isPriceChartBlocked,
    actionButtons,
    handleExplorerLink,
    trackTokenId,
    handleOpenTrackTokenDetail,
    activity
  }
}
