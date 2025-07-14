import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldOfframpBlocked } from 'store/posthog'
import { useMemo } from 'react'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { LocalTokenWithBalance } from '../../../../store/balance/types'
import { useMeldToken } from '../store'
import { CryptoCurrencyWithBalance } from '../types'
import { useSearchCryptoCurrencies } from './useSearchCryptoCurrencies'
import { useGetTradableCryptoCurrency } from './useGetTradableCryptoCurrency'

type NavigateToWithdrawParams = {
  token?: LocalTokenWithBalance
  address?: string
}

export const useWithdraw = (): {
  navigateToWithdraw: (props?: NavigateToWithdrawParams) => void
  navigateToWithdrawAmountWithToken: (token: CryptoCurrencyWithBalance) => void
  navigateToWithdrawAmountWithAvax: () => void
  navigateToWithdrawAmountWithUsdc: () => void
  isWithdrawable: (token?: LocalTokenWithBalance, address?: string) => boolean
  isLoadingCryptoCurrencies: boolean
} => {
  const { navigate } = useRouter()
  const [_, setOfframpToken] = useMeldToken()
  const isMeldOfframpBlocked = useSelector(selectIsMeldOfframpBlocked)
  const { data: cryptoCurrencies, isLoading: isLoadingCryptoCurrencies } =
    useSearchCryptoCurrencies({
      categories: [ServiceProviderCategories.CRYPTO_OFFRAMP]
    })
  const { getTradableCryptoCurrency } = useGetTradableCryptoCurrency({
    category: ServiceProviderCategories.CRYPTO_OFFRAMP
  })

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
        token => token.currencyCode === MELD_CURRENCY_CODES.USDC_AVAXC
      ),
    [cryptoCurrencies]
  )

  const navigateToWithdraw = useCallback(
    (props?: NavigateToWithdrawParams) => {
      const { token, address } = props ?? {}
      if (isMeldOfframpBlocked) {
        return
      }

      if (token || address) {
        const cryptoCurrency = getTradableCryptoCurrency(token, address)
        setOfframpToken(cryptoCurrency)
      } else {
        setOfframpToken(undefined)
      }
      // @ts-ignore TODO: make routes typesafe
      navigate('/meld/offramp')
    },
    [getTradableCryptoCurrency, isMeldOfframpBlocked, navigate, setOfframpToken]
  )

  const navigateToWithdrawAmountWithToken = useCallback(
    (token: CryptoCurrencyWithBalance) => {
      if (isMeldOfframpBlocked) return
      setOfframpToken(token)
      // @ts-ignore TODO: make routes typesafe
      navigate('/meld/offramp/selectWithdrawAmount')
    },
    [isMeldOfframpBlocked, navigate, setOfframpToken]
  )

  const navigateToWithdrawAmountWithAvax = useCallback(() => {
    if (avax === undefined || isMeldOfframpBlocked) return
    setOfframpToken(avax)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meld/offramp/selectWithdrawAmount')
  }, [avax, isMeldOfframpBlocked, navigate, setOfframpToken])

  const navigateToWithdrawAmountWithUsdc = useCallback(() => {
    if (usdc === undefined || isMeldOfframpBlocked) return
    setOfframpToken(usdc)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meld/offramp/selectWithdrawAmount')
  }, [usdc, isMeldOfframpBlocked, navigate, setOfframpToken])

  return {
    navigateToWithdraw,
    navigateToWithdrawAmountWithToken,
    navigateToWithdrawAmountWithAvax,
    navigateToWithdrawAmountWithUsdc,
    isWithdrawable,
    isLoadingCryptoCurrencies
  }
}
