import { Button, View } from '@avalabs/k2-alpine'
import { AVAX_COINGECKO_ID } from 'consts/coingecko'
import { USDC_TOKEN_ID } from 'common/consts/swap'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectBalanceTotalForAccount } from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsEarnBlocked } from 'store/posthog'
import { MarketType } from 'store/watchlist'

// TODO: reenable buy after backend work is done
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
  const activeAccount = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotal = useSelector(
    selectBalanceTotalForAccount(activeAccount?.index ?? 0, tokenVisibility)
  )
  const isZeroBalance = balanceTotal === 0n
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
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
    // actions.push(buyButton)
    tokenId === AVAX_COINGECKO_ID && actions.push(buyButton)
  } else if (tokenId === AVAX_COINGECKO_ID) {
    // for AVAX, show stake instead of buy button if user has enough AVAX
    hasEnoughAvax
      ? !earnBlocked && actions.push(stakeButton)
      : actions.push(buyButton)

    // always show swap button for AVAX
    actions.push(generateSwapButton(USDC_TOKEN_ID))
  } else {
    // user has some balance, show both buy and swap button for all other tokens
    //actions.push(buyButton)

    // however, only show swap button if the token is a trending one
    // as we currently only support swapping on Avanlanche network
    // (all trending tokens are on Avalanche network)
    tokenInfo &&
      tokenInfo.marketType === MarketType.TRENDING &&
      actions.push(generateSwapButton(tokenInfo.contractAddress))
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <View
      sx={{
        flexDirection: 'row',
        gap: 12
      }}>
      {actions}
    </View>
  )
}
