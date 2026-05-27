import { ChainId } from '@avalabs/core-chains-sdk'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useHasXpAddresses } from 'common/hooks/useHasXpAddresses'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { useMarketToken } from 'common/hooks/useMarketToken'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { tokenIds } from 'consts/tokenIds'
import { useRouter } from 'expo-router'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'
import { ActionButton } from 'features/portfolio/assets/components/ActionButtons'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { useIsBalanceAccurateByNetwork } from 'features/portfolio/hooks/useIsBalanceAccurateByNetwork'
import { useIsLoadingBalancesForAccount } from 'features/portfolio/hooks/useIsLoadingBalancesForAccount'
import { useSendSelectedToken } from 'features/send/store'
import { useAddStake } from 'features/stake/hooks/useAddStake'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { AVAX_P_ID } from 'services/balance/const'
import { selectActiveAccount } from 'store/account/slice'
import { LocalTokenWithBalance } from 'store/balance'
import {
  selectIsFusionEnabled,
  selectIsMeldOfframpBlocked,
  selectIsPriceChartBlocked
} from 'store/posthog'
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

/**
 * Everything both `XpTokenDetailScreen` and `NonXpTokenDetailScreen` need to
 * render a token detail page — formatted balance, action buttons, explorer
 * navigation, market lookup, and the filtered activity list. Lives at this
 * level so each layout file only contains layout, not data wiring.
 */
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

  // Swap is not supported on X/P chains.
  const isSwapUIDisabledForNetwork = useMemo(
    () =>
      token?.networkChainId === ChainId.AVALANCHE_X ||
      token?.networkChainId === ChainId.AVALANCHE_TEST_X ||
      token?.networkChainId === ChainId.AVALANCHE_P ||
      token?.networkChainId === ChainId.AVALANCHE_TEST_P,
    [token?.networkChainId]
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

  const actionButtons = useMemo<ActionButton[]>(() => {
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

  const activity = useTokenActivity({ token, handleExplorerLink })

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
