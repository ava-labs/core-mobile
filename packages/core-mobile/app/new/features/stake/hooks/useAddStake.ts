import { showAlert } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldIntegrationBlocked } from 'store/posthog'

export const useAddStake = (): {
  addStake: () => void
  canAddStake: boolean
} => {
  const { navigate } = useRouter()
  const isMeldIntegrationBlocked = useSelector(selectIsMeldIntegrationBlocked)
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  const [canAddStake, setCanAddStake] = useState(false)
  const { minStakeAmount } = useStakingParams()
  const { navigateToSwap } = useNavigateToSwap()

  const handleBuy = useCallback((): void => {
    if (isMeldIntegrationBlocked) {
      // @ts-ignore TODO: make routes typesafe
      navigate('/buy')
      return
    }
    // @ts-ignore TODO: make routes typesafe
    navigate('/buyOnramp')
  }, [isMeldIntegrationBlocked, navigate])

  const showNotEnoughAvaxAlert = useCallback((): void => {
    showAlert({
      title: `${minStakeAmount} available AVAX required`,
      description:
        'Staking your AVAX in the Avalanche Network allows you to earn up to 10% APY.',
      buttons: [
        {
          text: 'Buy AVAX',
          onPress: handleBuy
        },
        {
          text: 'Swap AVAX',
          onPress: navigateToSwap
        },
        {
          text: 'Cancel'
        }
      ]
    })
  }, [minStakeAmount, navigateToSwap, handleBuy])

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
