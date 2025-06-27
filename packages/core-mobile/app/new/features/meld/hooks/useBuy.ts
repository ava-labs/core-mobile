import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldIntegrationBlocked } from 'store/posthog'
import { useMemo } from 'react'
import { useMeldToken } from '../store'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { LocalTokenWithBalance } from '../../../../store/balance/types'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'
import { useGetTradableCryptoCurrency } from './useGetTradableCryptoCurrency'

type NavigateToBuyParams = {
  showAvaxWarning?: boolean
  token?: LocalTokenWithBalance
  address?: string
}

export const useBuy = (): {
  navigateToBuy: (props?: NavigateToBuyParams) => void
  navigateToBuyAvax: () => void
  navigateToBuyUsdc: () => void
  isBuyable: (token?: LocalTokenWithBalance, address?: string) => boolean
  isLoadingCryptoCurrencies: boolean
} => {
  const { navigate } = useRouter()
  const [_meldToken, setMeldToken] = useMeldToken()
  const isMeldIntegrationBlocked = useSelector(selectIsMeldIntegrationBlocked)
  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
    })
  const { getTradableCryptoCurrency } = useGetTradableCryptoCurrency({
    category: ServiceProviderCategories.CRYPTO_ONRAMP
  })

  const isBuyable = useCallback(
    (token?: LocalTokenWithBalance, address?: string) => {
      return getTradableCryptoCurrency(token, address) !== undefined
    },
    [getTradableCryptoCurrency]
  )

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
        token => token.currencyCode === MELD_CURRENCY_CODES.USDC_AVAXC
      ),
    [cryptoCurrencies]
  )

  const navigateToBuy = useCallback(
    (props?: NavigateToBuyParams) => {
      const { token, address, showAvaxWarning } = props ?? {}
      if (isMeldIntegrationBlocked) {
        navigate({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/buy',
          params: { showAvaxWarning: showAvaxWarning?.toString() }
        })
        return
      }

      if (token || address) {
        const cryptoCurrency = getTradableCryptoCurrency(token, address)
        setMeldToken(cryptoCurrency)
        // @ts-ignore TODO: make routes typesafe
        navigate('/meld/onramp/selectBuyAmount')
        return
      }
      setMeldToken(undefined)
      // @ts-ignore TODO: make routes typesafe
      navigate('/meld/onramp')
    },
    [
      getTradableCryptoCurrency,
      isMeldIntegrationBlocked,
      navigate,
      setMeldToken
    ]
  )

  const navigateToBuyAvax = useCallback(() => {
    if (avax === undefined) return
    setMeldToken(avax)

    // @ts-ignore TODO: make routes typesafe
    navigate('/meld/onramp/selectBuyAmount')
  }, [avax, navigate, setMeldToken])

  const navigateToBuyUsdc = useCallback(() => {
    if (usdc === undefined) return
    setMeldToken(usdc)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meld/onramp/selectBuyAmount')
  }, [usdc, navigate, setMeldToken])

  return {
    navigateToBuy,
    navigateToBuyAvax,
    navigateToBuyUsdc,
    isBuyable,
    isLoadingCryptoCurrencies
  }
}
