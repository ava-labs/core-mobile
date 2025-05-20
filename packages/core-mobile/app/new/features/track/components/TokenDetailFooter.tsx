import { Button, View } from '@avalabs/k2-alpine'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectBalanceTotalForAccount } from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsEarnBlocked, selectIsSwapBlocked } from 'store/posthog'
import { MarketType } from 'store/watchlist'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useIsSwappable } from 'common/hooks/useIsSwapable'
import { USDC_TOKEN_ID } from 'common/consts/swap'
import { getTokenActions } from '../utils/getTokenActions'

export const TokenDetailFooter = ({
  isAVAX,
  marketType,
  contractAddress,
  chainId,
  onBuy,
  onStake,
  onSwap
}: {
  isAVAX: boolean
  marketType: MarketType
  contractAddress: string | undefined
  chainId: number | undefined
  onBuy: () => void
  onStake: () => void
  onSwap: (initialTokenIdTo?: string) => void
}): JSX.Element | null => {
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { isSwappable } = useIsSwappable()
  const isSwapBlocked = useSelector(selectIsSwapBlocked)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotal = useSelector(
    selectBalanceTotalForAccount(activeAccount?.index ?? 0, tokenVisibility)
  )
  const isZeroBalance = balanceTotal === 0n
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  const isEarnBlocked = useSelector(selectIsEarnBlocked)

  const isTokenSwappable = isSwappable({
    tokenAddress: contractAddress,
    chainId
  })

  const buyButton = useMemo(
    () => (
      <Button
        key="buy"
        type={'primary'}
        size={'large'}
        onPress={onBuy}
        style={{ flex: 1 }}>
        Buy
      </Button>
    ),
    [onBuy]
  )

  const stakeButton = useMemo(
    () => (
      <Button
        key="stake"
        type={'primary'}
        size={'large'}
        onPress={onStake}
        style={{ flex: 1 }}>
        Stake
      </Button>
    ),
    [onStake]
  )

  const generateSwapButton = useCallback(
    (initialTokenIdTo?: string): JSX.Element => (
      <Button
        key="swap"
        type={'primary'}
        size={'large'}
        onPress={() => onSwap(initialTokenIdTo)}
        style={{ flex: 1 }}>
        Swap
      </Button>
    ),
    [onSwap]
  )

  const actions = useMemo(() => {
    const result = []

    const { showBuy, showSwap, showStake } = getTokenActions({
      isAVAX,
      marketType,
      isTokenSwappable,
      isSwapBlocked: isSwapBlocked || isDeveloperMode,
      isZeroBalance,
      hasEnoughAvax,
      isEarnBlocked
    })

    showBuy && result.push(buyButton)

    showStake && result.push(stakeButton)

    showSwap &&
      result.push(generateSwapButton(isAVAX ? USDC_TOKEN_ID : contractAddress))

    return result
  }, [
    contractAddress,
    marketType,
    isDeveloperMode,
    isSwapBlocked,
    isZeroBalance,
    hasEnoughAvax,
    isEarnBlocked,
    buyButton,
    stakeButton,
    generateSwapButton,
    isAVAX,
    isTokenSwappable
  ])

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
