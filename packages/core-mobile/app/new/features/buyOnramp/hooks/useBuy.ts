import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldIntegrationBlocked } from 'store/posthog'
import { useMemo } from 'react'
import { useOnRampSourceAmount, useOnRampToken } from '../store'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { LocalTokenWithBalance } from '../../../../store/balance/types'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'
import { useGetBuyableCryptoCurrency } from './useGetBuyableCryptoCurrency'

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
  const [_onrampToken, setOnrampToken] = useOnRampToken()
  const [_sourceAmount, setSourceAmount] = useOnRampSourceAmount()
  const isMeldIntegrationBlocked = useSelector(selectIsMeldIntegrationBlocked)
  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
    })
  const { getBuyableCryptoCurrency } = useGetBuyableCryptoCurrency()

  const isBuyable = useCallback(
    (token?: LocalTokenWithBalance, address?: string) => {
      return getBuyableCryptoCurrency(token, address) !== undefined
    },
    [getBuyableCryptoCurrency]
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
        token => token.currencyCode === MELD_CURRENCY_CODES.USDC
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

      setSourceAmount(0)
      if (token || address) {
        const cryptoCurrency = getBuyableCryptoCurrency(token, address)
        setOnrampToken(cryptoCurrency)
        // @ts-ignore TODO: make routes typesafe
        navigate('/buyOnramp/selectBuyAmount')
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
      setOnrampToken,
      setSourceAmount
    ]
  )

  const navigateToBuyAvax = useCallback(() => {
    if (avax === undefined) return
    setOnrampToken(avax)
    // @ts-ignore TODO: make routes typesafe
    navigate('/buyOnramp/selectBuyAmount')
  }, [avax, navigate, setOnrampToken])

  const navigateToBuyUsdc = useCallback(() => {
    if (usdc === undefined) return
    setOnrampToken(usdc)
    // @ts-ignore TODO: make routes typesafe
    navigate('/buyOnramp/selectBuyAmount')
  }, [usdc, navigate, setOnrampToken])

  return {
    navigateToBuy,
    navigateToBuyAvax,
    navigateToBuyUsdc,
    isBuyable,
    isLoadingCryptoCurrencies
  }
}
