import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useMeldToken } from '../store'
import {
  CreateCryptoQuote,
  CreateCryptoQuoteError,
  CreateCryptoQuoteErrorCode,
  CreateCryptoQuoteNotFoundError,
  Quote
} from '../types'
import { ServiceProviderCategories } from '../consts'
import { useCreateCryptoQuote } from './useCreateCryptoQuote'
import { useLocale } from './useLocale'

export const useServiceProviders = ({
  category
}: {
  category: ServiceProviderCategories
}): {
  crytoQuotes: Quote[]
  isLoadingCryptoQuotes: boolean
  cryptoQuotesError?: {
    statusCode: CreateCryptoQuoteErrorCode
    message: string
  }
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<CreateCryptoQuote | undefined, Error>>
  isRefetchingCryptoQuotes: boolean
} => {
  const [meldToken] = useMeldToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { countryCode } = useLocale()

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
    countryCode
  })

  const cryptoQuotesError = useMemo(() => {
    if (error && 'response' in error) {
      const response = error.response as {
        data?: CreateCryptoQuoteError | CreateCryptoQuoteNotFoundError
      }
      if (response.data && 'status' in response.data) {
        return {
          statusCode: response.data.status,
          message: response.data.message
        }
      }
      if (response.data && 'code' in response.data) {
        return {
          statusCode: response.data.code,
          message: response.data.message
        }
      }
    }
    return undefined
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
