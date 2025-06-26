import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldIntegrationBlocked } from 'store/posthog'
import { useMemo } from 'react'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { LocalTokenWithBalance } from '../../../../store/balance/types'
import { useOffRampToken, useOffRampSourceAmount } from '../meldOfframp/store'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'
import { useGetTradableCryptoCurrency } from './useGetTradableCryptoCurrency'

type NavigateToWithdrawParams = {
  token?: LocalTokenWithBalance
  address?: string
}

export const useWithdraw = (): {
  navigateToWithdraw: (props?: NavigateToWithdrawParams) => void
  navigateToWithdrawAvax: () => void
  navigateToWithdrawUsdc: () => void
  isWithdrawable: (token?: LocalTokenWithBalance, address?: string) => boolean
  isLoadingCryptoCurrencies: boolean
} => {
  const { navigate } = useRouter()
  const [_onrampToken, setOnrampToken] = useOffRampToken()
  const [_sourceAmount, setSourceAmount] = useOffRampSourceAmount()
  const isMeldIntegrationBlocked = useSelector(selectIsMeldIntegrationBlocked)
  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_OFFRAMP]
    })
  const { getTradableCryptoCurrency } = useGetTradableCryptoCurrency()

  const isWithdrawable = useCallback(
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
        token => token.currencyCode === MELD_CURRENCY_CODES.USDC
      ),
    [cryptoCurrencies]
  )

  const navigateToWithdraw = useCallback(
    (props?: NavigateToWithdrawParams) => {
      const { token, address } = props ?? {}
      if (isMeldIntegrationBlocked) {
        return
      }

      setSourceAmount(0)
      if (token || address) {
        const cryptoCurrency = getTradableCryptoCurrency(token, address)
        setOnrampToken(cryptoCurrency)
        // @ts-ignore TODO: make routes typesafe
        navigate('/meldOfframp/selectWithdrawAmount')
        return
      }
      setOnrampToken(undefined)
      // @ts-ignore TODO: make routes typesafe
      navigate('/meldOfframp')
    },
    [
      getTradableCryptoCurrency,
      isMeldIntegrationBlocked,
      navigate,
      setOnrampToken,
      setSourceAmount
    ]
  )

  const navigateToWithdrawAvax = useCallback(() => {
    if (avax === undefined) return
    setOnrampToken(avax)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOfframp/selectWithdrawAmount')
  }, [avax, navigate, setOnrampToken])

  const navigateToWithdrawUsdc = useCallback(() => {
    if (usdc === undefined) return
    setOnrampToken(usdc)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meldOfframp/selectWithdrawAmount')
  }, [usdc, navigate, setOnrampToken])

  return {
    navigateToWithdraw,
    navigateToWithdrawAvax,
    navigateToWithdrawUsdc,
    isWithdrawable,
    isLoadingCryptoCurrencies
  }
}
