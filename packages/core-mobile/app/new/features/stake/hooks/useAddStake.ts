import { showAlert } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useBuy } from 'features/buyOnramp/hooks/useBuy'
import { useSearchCryptoCurrencies } from 'features/buyOnramp/hooks/useSearchCryptoCurrencies'
import { useSearchServiceProviders } from 'features/buyOnramp/hooks/useSearchServiceProviders'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useCallback, useEffect, useState } from 'react'
import {
  MELD_CURRENCY_CODES,
  SearchProviderCategories
} from 'services/meld/consts'
import { useMemo } from 'react'

export const useAddStake = (): {
  addStake: () => void
  canAddStake: boolean
} => {
  const { navigate } = useRouter()
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()
  const [canAddStake, setCanAddStake] = useState(false)
  const { minStakeAmount } = useStakingParams()
  const { navigateToSwap } = useNavigateToSwap()
  const { navigateToBuy } = useBuy()
  const { data: serviceProviders } = useSearchServiceProviders({
    categories: [SearchProviderCategories.CryptoOnramp]
  })
  const { data: cryptoCurrencies } = useSearchCryptoCurrencies({
    categories: [SearchProviderCategories.CryptoOnramp],
    serviceProviders: serviceProviders?.map(
      serviceProvider => serviceProvider.serviceProvider
    )
  })

  const cryptoCurrency = useMemo(
    () =>
      cryptoCurrencies?.find(
        crypto => crypto.currencyCode === MELD_CURRENCY_CODES.AVAXC
      ),
    [cryptoCurrencies]
  )

  const showNotEnoughAvaxAlert = useCallback((): void => {
    const buttons = []
    if (cryptoCurrency) {
      buttons.push({
        text: 'Buy AVAX',
        onPress: () => navigateToBuy({ cryptoCurrency })
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
      description:
        'Staking your AVAX in the Avalanche Network allows you to earn up to 10% APY.',
      buttons
    })
  }, [minStakeAmount, navigateToSwap, navigateToBuy, cryptoCurrency])

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
