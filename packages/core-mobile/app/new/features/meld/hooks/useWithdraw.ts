import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectIsMeldIntegrationBlocked } from 'store/posthog'
import { useMemo } from 'react'
import { MELD_CURRENCY_CODES, ServiceProviderCategories } from '../consts'
import { LocalTokenWithBalance } from '../../../../store/balance/types'
import { useMeldToken } from '../store'
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
  const [_meldToken, setMeldToken] = useMeldToken()
  const isMeldIntegrationBlocked = useSelector(selectIsMeldIntegrationBlocked)
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

      if (token || address) {
        const cryptoCurrency = getTradableCryptoCurrency(token, address)
        setMeldToken(cryptoCurrency)
        // @ts-ignore TODO: make routes typesafe
        navigate('/meld/offramp/selectWithdrawAmount')
        return
      }
      setMeldToken(undefined)
      // @ts-ignore TODO: make routes typesafe
      navigate('/meld/offramp')
    },
    [
      getTradableCryptoCurrency,
      isMeldIntegrationBlocked,
      navigate,
      setMeldToken
    ]
  )

  const navigateToWithdrawAvax = useCallback(() => {
    if (avax === undefined) return
    setMeldToken(avax)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meld/offramp/selectWithdrawAmount')
  }, [avax, navigate, setMeldToken])

  const navigateToWithdrawUsdc = useCallback(() => {
    if (usdc === undefined) return
    setMeldToken(usdc)
    // @ts-ignore TODO: make routes typesafe
    navigate('/meld/offramp/selectWithdrawAmount')
  }, [usdc, navigate, setMeldToken])

  return {
    navigateToWithdraw,
    navigateToWithdrawAvax,
    navigateToWithdrawUsdc,
    isWithdrawable,
    isLoadingCryptoCurrencies
  }
}
