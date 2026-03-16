import { Button } from '@avalabs/k2-alpine'
import { tokenIds } from 'consts/tokenIds'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useBalanceTotalForAccount } from 'features/portfolio/hooks/useBalanceTotalForAccount'
import {
  selectIsEarnBlocked,
  selectIsFusionEnabled,
  selectIsSwapBlocked
} from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { MarketType } from 'store/watchlist'
import { selectActiveAccount } from 'store/account'
import { getTokenActions } from '../utils/getTokenActions'

export function useTrackTokenActions({
  isAVAX,
  marketType,
  contractAddress,
  onBuy,
  onStake,
  onSwap
}: {
  isAVAX: boolean
  marketType: MarketType
  contractAddress: string | undefined
  onBuy: () => void
  onStake: () => void
  onSwap: (initialTokenIdTo?: string) => void
}): { actions: JSX.Element[] } {
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isFusionEnabled = useSelector(selectIsFusionEnabled)
  const isSwapBlocked = useSelector(selectIsSwapBlocked)
  const balanceTotal = useBalanceTotalForAccount(activeAccount)
  const isZeroBalance = balanceTotal === 0n
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  const isEarnBlocked = useSelector(selectIsEarnBlocked)

  const isTokenSwappable = isFusionEnabled && !!contractAddress

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
        testID="token_detail_swap_btn"
        key="swap"
        type={'primary'}
        size={'large'}
        onPress={() => onSwap(initialTokenIdTo)}
        style={{ flex: 1 }}>
        Buy
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

    if (showSwap) {
      result.push(generateSwapButton(isAVAX ? tokenIds.USDC : contractAddress))
    }

    return result
  }, [
    isAVAX,
    marketType,
    isTokenSwappable,
    isSwapBlocked,
    isDeveloperMode,
    isZeroBalance,
    hasEnoughAvax,
    isEarnBlocked,
    buyButton,
    stakeButton,
    generateSwapButton,
    contractAddress
  ])

  return {
    actions
  }
}
