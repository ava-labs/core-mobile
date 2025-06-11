import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldIntegrationBlocked } from 'store/posthog'
import { useOnRampSourceAmount, useOnRampToken } from '../store'
import { CryptoCurrency } from './useSearchCryptoCurrencies'

type NavigateToBuyParams = {
  showAvaxWarning?: boolean
  cryptoCurrency?: CryptoCurrency
}

export const useBuy = (): {
  navigateToBuy: ({
    showAvaxWarning,
    cryptoCurrency
  }: NavigateToBuyParams) => void
} => {
  const { navigate } = useRouter()
  const [_onrampToken, setOnrampToken] = useOnRampToken()
  const [_sourceAmount, setSourceAmount] = useOnRampSourceAmount()
  const isMeldIntegrationBlocked = useSelector(selectIsMeldIntegrationBlocked)

  const navigateToBuy = useCallback(
    ({ showAvaxWarning, cryptoCurrency }: NavigateToBuyParams) => {
      if (isMeldIntegrationBlocked) {
        navigate({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/buy',
          params: { showAvaxWarning: showAvaxWarning?.toString() }
        })
        return
      }

      setSourceAmount(0)
      if (cryptoCurrency) {
        setOnrampToken(cryptoCurrency)
        // @ts-ignore TODO: make routes typesafe
        navigate('/buyOnramp/selectBuyAmount')
        return
      }
      setOnrampToken(undefined)
      // @ts-ignore TODO: make routes typesafe
      navigate('/buyOnramp')
    },
    [isMeldIntegrationBlocked, navigate, setOnrampToken, setSourceAmount]
  )

  return {
    navigateToBuy
  }
}
