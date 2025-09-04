import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldOnrampBlocked } from 'store/posthog'
import { useMemo } from 'react'
import { useMeldToken } from '../store'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { LocalTokenWithBalance } from '../../../../store/balance/types'
import { CryptoCurrencyWithBalance } from '../types'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'
import { useGetTradableCryptoCurrency } from './useGetTradableCryptoCurrency'

type NavigateToBuyParams = {
  showAvaxWarning?: boolean
  token?: LocalTokenWithBalance
  address?: string
}

export const useBuy = (): {
  navigateToBuy: (props?: NavigateToBuyParams) => void
  navigateToBuyAmountWithToken: (token: CryptoCurrencyWithBalance) => void
  navigateToBuyAmountWithAvax: () => void
  navigateToBuyAmountWithUsdc: () => void
  isBuyable: (token?: LocalTokenWithBalance, address?: string) => boolean
  isLoadingCryptoCurrencies: boolean
} => {
  const { navigate } = useRouter()
  const [_onrampToken, setOnrampToken] = useMeldToken()
  const isMeldOnrampBlocked = useSelector(selectIsMeldOnrampBlocked)
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
        const cryptoCurrency = getTradableCryptoCurrency(token, address)
        setOnrampToken(cryptoCurrency)
        // @ts-ignore TODO: make routes typesafe
        navigate('/meld/onramp/selectBuyAmount')
      } else {
        setOnrampToken(undefined)
        // @ts-ignore TODO: make routes typesafe
        navigate('/meld/onramp')
      }
    },
    [getTradableCryptoCurrency, isMeldOnrampBlocked, navigate, setOnrampToken]
  )

  const navigateToBuyAmountWithToken = useCallback(
    (token: CryptoCurrencyWithBalance) => {
      if (isMeldOnrampBlocked) {
        handleBuy()
        return
      }

      setOnrampToken(token)
      // @ts-ignore TODO: make routes typesafe
      navigate('/meld/onramp/selectBuyAmount')
    },
    [handleBuy, isMeldOnrampBlocked, navigate, setOnrampToken]
  )

  const navigateToBuyAmountWithAvax = useCallback(() => {
    if (isMeldOnrampBlocked) {
      handleBuy()
      return
    }

    if (avax === undefined) return

    setOnrampToken(avax)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meld/onramp/selectBuyAmount')
  }, [avax, handleBuy, isMeldOnrampBlocked, navigate, setOnrampToken])

  const navigateToBuyAmountWithUsdc = useCallback(() => {
    if (isMeldOnrampBlocked) {
      handleBuy()
      return
    }

    if (usdc === undefined) return
    setOnrampToken(usdc)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meld/onramp/selectBuyAmount')
  }, [isMeldOnrampBlocked, usdc, setOnrampToken, navigate, handleBuy])

  return {
    navigateToBuy,
    navigateToBuyAmountWithToken,
    navigateToBuyAmountWithAvax,
    navigateToBuyAmountWithUsdc,
    isBuyable,
    isLoadingCryptoCurrencies
  }
}
