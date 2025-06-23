import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldOnrampBlocked } from 'store/posthog'
import { useMemo } from 'react'
import { useOnRampToken } from '../store'
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
  const isMeldOnrampBlocked = useSelector(selectIsMeldOnrampBlocked)
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
        token => token.currencyCode === MELD_CURRENCY_CODES.USDC_AVAXC
      ),
    [cryptoCurrencies]
  )

  const handleBuy = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate({ pathname: '/buy' })
  }, [navigate])

  const navigateToBuy = useCallback(
    (props?: NavigateToBuyParams) => {
      const { token, address, showAvaxWarning } = props ?? {}
      if (isMeldOnrampBlocked) {
        navigate({
          // @ts-ignore TODO: make routes typesafe
          pathname: '/buy',
          params: { showAvaxWarning: showAvaxWarning?.toString() }
        })
        return
      }

      if (token || address) {
        const cryptoCurrency = getBuyableCryptoCurrency(token, address)
        setOnrampToken(cryptoCurrency)
        // @ts-ignore TODO: make routes typesafe
        navigate('/meldOnramp/selectBuyAmount')
        return
      }
      setOnrampToken(undefined)
      // @ts-ignore TODO: make routes typesafe
      navigate('/meldOnramp')
    },
    [getBuyableCryptoCurrency, isMeldOnrampBlocked, navigate, setOnrampToken]
  )

  const navigateToBuyAvax = useCallback(() => {
    if (isMeldOnrampBlocked) {
      handleBuy()
      return
    }

    if (avax === undefined) return

    setOnrampToken(avax)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOnramp/selectBuyAmount')
  }, [avax, handleBuy, isMeldOnrampBlocked, navigate, setOnrampToken])

  const navigateToBuyUsdc = useCallback(() => {
    if (isMeldOnrampBlocked) {
      handleBuy()
      return
    }

    if (usdc === undefined) return
    setOnrampToken(usdc)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOnramp/selectBuyAmount')
  }, [isMeldOnrampBlocked, usdc, setOnrampToken, navigate, handleBuy])

  return {
    navigateToBuy,
    navigateToBuyAvax,
    navigateToBuyUsdc,
    isBuyable,
    isLoadingCryptoCurrencies
  }
}
