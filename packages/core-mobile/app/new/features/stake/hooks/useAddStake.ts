import { showAlert } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useBuy } from 'features/meld/hooks/useBuy'
import { useIsAvaxCSupported } from 'features/meld/hooks/useIsAvaxCSupported'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useCallback, useEffect, useState } from 'react'

export const useAddStake = (): {
  addStake: () => void
  canAddStake: boolean
} => {
  const { navigate } = useRouter()
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  const [canAddStake, setCanAddStake] = useState(false)
  const { minStakeAmount, annualPercentageYieldBPS } = useStakingParams()
  const { navigateToSwap } = useNavigateToSwap()
  const { navigateToBuyAmountWithAvax } = useBuy()
  const isAvaxCSupported = useIsAvaxCSupported()

  const showNotEnoughAvaxAlert = useCallback((): void => {
    const buttons = []
    if (isAvaxCSupported) {
      buttons.push({
        text: 'Buy AVAX',
        onPress: navigateToBuyAmountWithAvax
      })
    }
    buttons.push({
      text: 'Swap AVAX',
      onPress: navigateToSwap
    })
    buttons.push({
      text: 'Cancel'
    })

    showAlert({
      title: `${minStakeAmount} available AVAX required`,
      description: `Staking your AVAX in the Avalanche Network allows you to earn up to ${
        annualPercentageYieldBPS / 100
      }% APY.`,
      buttons
    })
  }, [
    isAvaxCSupported,
    navigateToSwap,
    minStakeAmount,
    annualPercentageYieldBPS,
    navigateToBuyAmountWithAvax
  ])

  useEffect(() => {
    setCanAddStake(hasEnoughAvax !== undefined)
  }, [hasEnoughAvax])

  const addStake = useCallback(() => {
    if (!canAddStake) return

    if (hasEnoughAvax) {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/addStake' })
    } else {
      showNotEnoughAvaxAlert()
    }
  }, [navigate, canAddStake, hasEnoughAvax, showNotEnoughAvaxAlert])

  return { addStake, canAddStake }
}
