import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useOnRampSourceAmount, useOnRampToken } from '../store'
import {
  CreateCryptoQuote,
  CreateCryptoQuoteError,
  CreateCryptoQuoteErrorCode,
  CreateCryptoQuoteNotFoundError,
  Quote
} from '../types'
import { useCreateCryptoQuote } from './useCreateCryptoQuote'
import { useLocale } from './useLocale'

export const useServiceProviders = (
  shouldCreateCryptoQuote = true
): {
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
  const [sourceAmount] = useOnRampSourceAmount()
  const { countryCode } = useLocale()

  const hasValidCountry = countryCode !== undefined
  const hasSelectedCurrency = selectedCurrency !== undefined
  const hasSourceAmount = sourceAmount !== undefined && sourceAmount !== 0
  const hasDestinationCurrencyCode =
    onRampToken?.currencyCode !== '' && onRampToken?.currencyCode !== undefined

  const shouldEnableCreateCryptoQuote =
    shouldCreateCryptoQuote &&
    hasValidCountry &&
    hasSelectedCurrency &&
    hasSourceAmount &&
    hasDestinationCurrencyCode

  const {
    data,
    isLoading: isLoadingCryptoQuotes,
    refetch,
    isRefetching: isRefetchingCryptoQuotes,
    error
  } = useCreateCryptoQuote({
    enabled: shouldEnableCreateCryptoQuote,
    sourceAmount: sourceAmount ?? 0,
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
    if (data?.quotes === undefined) return []
    return data.quotes.toSorted((a, b) => a.totalFee - b.totalFee)
  }, [data])

  return {
    crytoQuotes,
    cryptoQuotesError,
    isLoadingCryptoQuotes,
    refetch,
    isRefetchingCryptoQuotes
  }
}
