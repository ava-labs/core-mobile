import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useOnRampToken } from '../store'
import {
  CreateCryptoQuote,
  CreateCryptoQuoteError,
  CreateCryptoQuoteErrorCode,
  CreateCryptoQuoteNotFoundError,
  Quote
} from '../types'
import { useCreateCryptoQuote } from './useCreateCryptoQuote'
import { useLocale } from './useLocale'

export const useServiceProviders = (): {
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
  const [onRampToken] = useOnRampToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { countryCode } = useLocale()

  const {
    data,
    isLoading: isLoadingCryptoQuotes,
    refetch,
    isRefetching: isRefetchingCryptoQuotes,
    error
  } = useCreateCryptoQuote({
    destinationCurrencyCode: onRampToken?.currencyCode ?? '',
    sourceCurrencyCode: selectedCurrency,
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
