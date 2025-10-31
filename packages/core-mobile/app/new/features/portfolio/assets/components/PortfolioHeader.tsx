import {
  BalanceHeader,
  PriceChangeStatus,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import React, { useCallback, useMemo } from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { useSelector } from 'react-redux'
import { useWithdraw } from 'features/meld/hooks/useWithdraw'
import { useBuy } from 'features/meld/hooks/useBuy'
import { selectIsMeldOfframpBlocked } from 'store/posthog'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectActiveAccount } from 'store/account'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useSendSelectedToken } from 'features/send/store'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useRouter } from 'expo-router'
import { ActionButtonTitle } from '../consts'
import { ActionButton, ActionButtons } from './ActionButtons'

interface PortfolioHeaderProps {
  targetHiddenProgress: SharedValue<number>
  setStickyHeaderLayout: (layout: LayoutRectangle) => void
  setBalanceHeaderLayout: (layout: LayoutRectangle) => void
  formattedBalance: string
  balanceAccurate: boolean
  isLoading: boolean
  formattedPriceChange?: string
  indicatorStatus: PriceChangeStatus
  formattedPercent?: string
  totalPriceChanged: number
}

export const PortfolioHeader = ({
  targetHiddenProgress,
  setStickyHeaderLayout,
  setBalanceHeaderLayout,
  formattedBalance,
  balanceAccurate,
  isLoading,
  formattedPriceChange,
  indicatorStatus,
  formattedPercent,
  totalPriceChanged
}: PortfolioHeaderProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()
  const isPrivacyModeEnabled = useFocusedSelector(selectIsPrivacyModeEnabled)
  const [_, setSelectedToken] = useSendSelectedToken()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isMeldOfframpBlocked = useSelector(selectIsMeldOfframpBlocked)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { navigateToBuy } = useBuy()
  const { navigateToWithdraw } = useWithdraw()
  const { navigateToSwap } = useNavigateToSwap()
  const activeAccount = useFocusedSelector(selectActiveAccount)
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleBridge = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/bridge'
    })
  }, [navigate])

  const handleSend = useCallback((): void => {
    setSelectedToken(undefined)
    // @ts-ignore TODO: make routes typesafe
    navigate('/send')
  }, [navigate, setSelectedToken])

  const handleReceive = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/receive')
  }, [navigate])

  const renderMaskView = useCallback((): JSX.Element => {
    return <HiddenBalanceText variant={'heading2'} sx={{ lineHeight: 38 }} />
  }, [])

  const handleStickyHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setStickyHeaderLayout(event.nativeEvent.layout)
    },
    [setStickyHeaderLayout]
  )

  const handleBalanceHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setBalanceHeaderLayout(event.nativeEvent.layout)
    },
    [setBalanceHeaderLayout]
  )

  const actionButtons = useMemo(() => {
    const buttons: ActionButton[] = [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: handleSend }
    ]
    if (!isDeveloperMode) {
      buttons.push({
        title: ActionButtonTitle.Swap,
        icon: 'swap',
        onPress: () => navigateToSwap()
      })
    }
    buttons.push({
      title: ActionButtonTitle.Buy,
      icon: 'buy',
      onPress: navigateToBuy
    })
    buttons.push({
      title: ActionButtonTitle.Receive,
      icon: 'receive',
      onPress: handleReceive
    })
    buttons.push({
      title: ActionButtonTitle.Bridge,
      icon: 'bridge',
      onPress: handleBridge
    })
    if (!isMeldOfframpBlocked) {
      buttons.push({
        title: ActionButtonTitle.Withdraw,
        icon: 'withdraw',
        onPress: navigateToWithdraw
      })
    }
    return buttons
  }, [
    handleSend,
    isDeveloperMode,
    navigateToBuy,
    navigateToWithdraw,
    handleReceive,
    handleBridge,
    navigateToSwap,
    isMeldOfframpBlocked
  ])

  return (
    <View
      style={{
        backgroundColor: colors.$surfacePrimary
      }}
      onLayout={handleStickyHeaderLayout}>
      <View onLayout={handleBalanceHeaderLayout}>
        <Animated.View
          style={[
            {
              backgroundColor: colors.$surfacePrimary,
              marginTop: 16,
              paddingHorizontal: 16
            },
            animatedHeaderStyle
          ]}>
          <BalanceHeader
            testID="portfolio"
            accountName={activeAccount?.name}
            formattedBalance={formattedBalance}
            currency={selectedCurrency}
            priceChange={
              totalPriceChanged !== 0
                ? {
                    formattedPrice: formattedPriceChange,
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
            renderMaskView={renderMaskView}
          />
        </Animated.View>
      </View>

      {filteredTokenList.length > 0 && (
        <ActionButtons
          buttons={actionButtons}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 10
          }}
        />
      )}
    </View>
  )
}
