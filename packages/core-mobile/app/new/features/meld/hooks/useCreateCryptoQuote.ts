import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useMemo } from 'react'
import MeldService from '../services/MeldService'
import { CreateCryptoQuote, CreateCryptoQuoteParams } from '../types'
import { ServiceProviderCategories } from '../consts'
import {} from '../store'
import { useSearchServiceProviders } from './useSearchServiceProviders'
import { useFiatSourceAmount } from './useFiatSourceAmount'

export const useCreateCryptoQuote = ({
  category,
  countryCode,
  walletAddress,
  destinationCurrencyCode,
  sourceCurrencyCode,
  paymentMethodType
}: CreateCryptoQuoteParams & {
  category: ServiceProviderCategories
}): UseQueryResult<CreateCryptoQuote | undefined, Error> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [category]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const {
    hasValidSourceAmount,
    sourceAmount: fiatSourceAmount,
    cryptoSourceAmount
  } = useFiatSourceAmount({
    category
  })

  const sourceAmount = useMemo(() => {
    return category === ServiceProviderCategories.CRYPTO_ONRAMP
      ? fiatSourceAmount ?? undefined
      : cryptoSourceAmount ?? undefined
  }, [category, cryptoSourceAmount, fiatSourceAmount])

  const hasDestinationCurrencyCode = destinationCurrencyCode !== ''
  const hasSourceCurrencyCode = sourceCurrencyCode !== ''
  const isSourceAmountValid = hasValidSourceAmount && sourceAmount !== undefined

  const enabled =
    isSourceAmountValid && hasDestinationCurrencyCode && hasSourceCurrencyCode

  return useQuery<CreateCryptoQuote | undefined>({
    enabled,
    queryKey: [
      ReactQueryKeys.MELD_CREATE_CRYPTO_QUOTE,
      serviceProviders,
      countryCode,
      walletAddress,
      sourceAmount,
      destinationCurrencyCode,
      sourceCurrencyCode,
      hasValidSourceAmount,
      paymentMethodType
    ],
    queryFn: () => {
      return MeldService.createCryptoQuote({
        serviceProviders,
        walletAddress,
        sourceAmount,
        countryCode,
        destinationCurrencyCode,
        sourceCurrencyCode,
        paymentMethodType
      })
    },
    staleTime: 1000 * 60 * 1 // 1 minute
  })
}
