import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useMeldCountryCode, useMeldToken } from '../store'
import { CreateCryptoQuote, CryptoQuotesError, Quote } from '../types'
import { PaymentMethods, ServiceProviderCategories } from '../consts'
import { getErrorMessage } from '../utils'
import { useCreateCryptoQuote } from './useCreateCryptoQuote'

export const useServiceProviders = ({
  category,
  paymentMethodType
}: {
  category: ServiceProviderCategories
  paymentMethodType?: PaymentMethods
}): {
  crytoQuotes: Quote[]
  isLoadingCryptoQuotes: boolean
  cryptoQuotesError?: CryptoQuotesError
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<CreateCryptoQuote | undefined, Error>>
  isRefetchingCryptoQuotes: boolean
} => {
  const [meldToken] = useMeldToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [countryCode] = useMeldCountryCode()

  const destinationCurrencyCode = useMemo(() => {
    return category === ServiceProviderCategories.CRYPTO_ONRAMP
      ? meldToken?.currencyCode ?? ''
      : selectedCurrency
  }, [category, meldToken?.currencyCode, selectedCurrency])

  const sourceCurrencyCode = useMemo(() => {
    return category === ServiceProviderCategories.CRYPTO_ONRAMP
      ? selectedCurrency
      : meldToken?.currencyCode ?? ''
  }, [category, meldToken?.currencyCode, selectedCurrency])

  const {
    data,
    isLoading: isLoadingCryptoQuotes,
    refetch,
    isRefetching: isRefetchingCryptoQuotes,
    error
  } = useCreateCryptoQuote({
    category,
    destinationCurrencyCode,
    sourceCurrencyCode,
    countryCode,
    paymentMethodType
  })

  const cryptoQuotesError = useMemo(() => {
    return getErrorMessage(error)
  }, [error])

  const crytoQuotes = useMemo(() => {
    if (data?.quotes === undefined || data.quotes === null) return []
    return data.quotes.toSorted((a, b) => (a.totalFee ?? 0) - (b.totalFee ?? 0))
  }, [data])

  return {
    crytoQuotes,
    cryptoQuotesError,
    isLoadingCryptoQuotes,
    refetch,
    isRefetchingCryptoQuotes
  }
}
