import { showAlert } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
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
  const { minStakeAmount } = useStakingParams()

  const handleBuy = (): void => {
    //Todo
  }

  const handleSwap = (): void => {
    // Todo
  }

  const showNotEnoughAvaxAlert = useCallback((): void => {
    showAlert({
      title: `${minStakeAmount} AVAX required`,
      description:
        'Staking your AVAX in the Avalanche Network allows you to earn up to 10% APY.',
      buttons: [
        {
          text: 'Buy AVAX',
          onPress: handleBuy
        },
        {
          text: 'Swap AVAX',
          onPress: handleSwap
        },
        {
          text: 'Cancel'
        }
      ]
    })
  }, [minStakeAmount])

  useEffect(() => {
    setCanAddStake(hasEnoughAvax !== undefined)
  }, [hasEnoughAvax])

  const addStake = useCallback(() => {
    if (!canAddStake) return

    if (hasEnoughAvax) {
      navigate({ pathname: '/addStake' })
    } else {
      showNotEnoughAvaxAlert()
    }
  }, [navigate, canAddStake, hasEnoughAvax, showNotEnoughAvaxAlert])

  return { addStake, canAddStake }
}
