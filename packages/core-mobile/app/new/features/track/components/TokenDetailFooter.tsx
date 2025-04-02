import { Button, View } from '@avalabs/k2-alpine'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { AVAX_COINGECKO_ID } from 'consts/coingecko'
import { USDC_TOKEN_ID } from 'consts/swap'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectBalanceTotalInCurrencyForAccount } from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsEarnBlocked } from 'store/posthog'
import { MarketType } from 'store/watchlist'

export const TokenDetailFooter = ({
  tokenId,
  tokenInfo,
  onBuy,
  onStake,
  onSwap
}: {
  tokenId: string
  tokenInfo?: { marketType: MarketType; contractAddress: string | undefined }
  onBuy: () => void
  onStake: () => void
  onSwap: (initialTokenIdTo?: string) => void
}): JSX.Element | null => {
  const { bottom } = useSafeAreaInsets()
  const activeAccount = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.index ?? 0,
      tokenVisibility
    )
  )
  const isZeroBalance = balanceTotalInCurrency === 0
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const swapDisabled = useIsUIDisabled(UI.Swap)
  const earnBlocked = useSelector(selectIsEarnBlocked)

  const buyButton = (
    <Button
      key="buy"
      type={'primary'}
      size={'large'}
      onPress={onBuy}
      style={{ flex: 1 }}>
      Buy
    </Button>
  )

  const stakeButton = (
    <Button
      key="stake"
      type={'primary'}
      size={'large'}
      onPress={onStake}
      style={{ flex: 1 }}>
      Stake
    </Button>
  )

  const generateSwapButton = (initialTokenIdTo?: string): JSX.Element => (
    <Button
      key="swap"
      type={'primary'}
      size={'large'}
      onPress={() => onSwap(initialTokenIdTo)}
      style={{ flex: 1 }}>
      Swap
    </Button>
  )

  const actions = []

  if (isZeroBalance) {
    // only show buy button if the user has zero balance
    !buyDisabled && actions.push(buyButton)
  } else if (tokenId === AVAX_COINGECKO_ID) {
    // for AVAX, show stake instead of buy button if user has enough AVAX
    hasEnoughAvax
      ? !earnBlocked && actions.push(stakeButton)
      : !buyDisabled && actions.push(buyButton)

    // always show swap button for AVAX
    !swapDisabled && actions.push(generateSwapButton(USDC_TOKEN_ID))
  } else {
    // user has some balance, show both buy and swap button for all other tokens
    !buyDisabled && actions.push(buyButton)

    // however, only show swap button if the token is a trending one
    // as we currently only support swapping on Avanlanche network
    // (all trending tokens are on Avalanche network)
    tokenInfo?.marketType === MarketType.TRENDING &&
      !swapDisabled &&
      actions.push(generateSwapButton(tokenInfo?.contractAddress))
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <LinearGradientBottomWrapper>
      <View
        sx={{
          paddingHorizontal: 16,
          paddingBottom: bottom + 12,
          flexDirection: 'row',
          gap: 12
        }}>
        {actions}
      </View>
    </LinearGradientBottomWrapper>
  )
}
