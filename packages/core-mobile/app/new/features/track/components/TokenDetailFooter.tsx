import { Button, View } from '@avalabs/k2-alpine'
import { USDC_AVALANCHE_C_TOKEN_ID } from 'common/consts/swap'
import { useActiveAccount } from 'common/hooks/useActiveAccount'
import { useIsSwappable } from 'common/hooks/useIsSwapable'
import { useIsSwapListLoaded } from 'common/hooks/useIsSwapListLoaded'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectBalanceTotalForAccount } from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsEarnBlocked, selectIsSwapBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { MarketType } from 'store/watchlist'
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
  const activeAccount = useActiveAccount()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { isSwappable } = useIsSwappable()
  const isSwapBlocked = useSelector(selectIsSwapBlocked)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotal = useSelector(
    selectBalanceTotalForAccount(activeAccount.id, tokenVisibility)
  )
  const isZeroBalance = balanceTotal === 0n
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  const isEarnBlocked = useSelector(selectIsEarnBlocked)

  const isSwapListLoaded = useIsSwapListLoaded()

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

    // the token's swapability depends on the swap list
    // thus, we need to wait for the swap list to load
    // so that we can display the swap button accordingly
    if (showSwap && isSwapListLoaded) {
      result.push(
        generateSwapButton(isAVAX ? USDC_AVALANCHE_C_TOKEN_ID : contractAddress)
      )
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
    isSwapListLoaded,
    generateSwapButton,
    contractAddress
  ])

  if (actions.length === 0) {
    return <></>
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
