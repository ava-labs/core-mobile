import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useOnRampSourceAmount, useOnRampToken } from '../store'
import { CreateCryptoQuote, Quote } from '../types'
import { useCreateCryptoQuote } from './useCreateCryptoQuote'

export const useServiceProviders = (): {
  crytoQuotes: Quote[]
  isLoadingCryptoQuotes: boolean
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<CreateCryptoQuote | undefined, Error>>
  isRefetchingCryptoQuotes: boolean
} => {
  const [onRampToken] = useOnRampToken()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [sourceAmount] = useOnRampSourceAmount()

  const {
    data,
    isLoading: isLoadingCryptoQuotes,
    refetch,
    isRefetching: isRefetchingCryptoQuotes
  } = useCreateCryptoQuote({
    sourceAmount: sourceAmount ?? 0,
    destinationCurrencyCode: onRampToken?.currencyCode ?? '',
    sourceCurrencyCode: selectedCurrency
  })

  const crytoQuotes = useMemo(() => {
    if (data?.quotes === undefined) return []
    return data.quotes.toSorted((a, b) => a.totalFee - b.totalFee)
  }, [data])

  return {
    crytoQuotes,
    isLoadingCryptoQuotes,
    refetch,
    isRefetchingCryptoQuotes
  }
}
