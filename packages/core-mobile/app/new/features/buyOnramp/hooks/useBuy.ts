import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldIntegrationBlocked } from 'store/posthog'
import { useMemo } from 'react'
import { useOnRampToken } from '../store'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { LocalTokenWithBalance } from '../../../../store/balance/types'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'
import { useGetBuyableCryptoCurrency } from './useGetBuyableCryptoCurrency'

type NavigateToBuyParams = {
  showAvaxWarning?: boolean
  tokenOrAddress?: LocalTokenWithBalance | string
}

export const useBuy = (): {
  navigateToBuy: (props?: NavigateToBuyParams) => void
  navigateToBuyAvax: () => void
  navigateToBuyUsdc: () => void
} => {
  const { navigate } = useRouter()
  const [_, setOnrampToken] = useOnRampToken()
  const isMeldIntegrationBlocked = useSelector(selectIsMeldIntegrationBlocked)
  const { data: cryptoCurrencies } = useSearchCryptoCurrencies({
    categories: [ServiceProviderCategories.CryptoOnramp]
  })
  const { getBuyableCryptoCurrency } = useGetBuyableCryptoCurrency()

  const avax = useMemo(
    () =>
      cryptoCurrencies?.find(
        token => token.currencyCode === MELD_CURRENCY_CODES.AVAXC
      ),
    [cryptoCurrencies]
  )

  const usdc = useMemo(
    () =>
      cryptoCurrencies?.find(
        token => token.currencyCode === MELD_CURRENCY_CODES.USDC
      ),
    [cryptoCurrencies]
  )

  const navigateToBuy = useCallback(
    (props?: NavigateToBuyParams) => {
      const { tokenOrAddress, showAvaxWarning } = props ?? {}
      if (isMeldIntegrationBlocked) {
        navigate({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/buy',
          params: { showAvaxWarning: showAvaxWarning?.toString() }
        })
        return
      }

      if (tokenOrAddress) {
        const cryptoCurrency = getBuyableCryptoCurrency(tokenOrAddress)
        setOnrampToken(cryptoCurrency)
        // @ts-ignore TODO: make routes typesafe
        navigate('/buyOnramp/selectAmount')
        return
      }
      setOnrampToken(undefined)
      // @ts-ignore TODO: make routes typesafe
      navigate('/buyOnramp')
    },
    [
      getBuyableCryptoCurrency,
      isMeldIntegrationBlocked,
      navigate,
      setOnrampToken
    ]
  )

  const navigateToBuyAvax = useCallback(() => {
    if (avax === undefined) return
    setOnrampToken(avax)
    // @ts-ignore TODO: make routes typesafe
    navigate('/buyOnramp/selectAmount')
  }, [avax, navigate, setOnrampToken])

  const navigateToBuyUsdc = useCallback(() => {
    if (usdc === undefined) return
    setOnrampToken(usdc)
    // @ts-ignore TODO: make routes typesafe
    navigate('/buyOnramp/selectAmount')
  }, [usdc, navigate, setOnrampToken])

  return {
    navigateToBuy,
    navigateToBuyAvax,
    navigateToBuyUsdc
  }
}
