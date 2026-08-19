import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useMemo } from 'react'
import MeldService from '../services/MeldService'
import { CreateCryptoQuote, CreateCryptoQuoteParams } from '../types'
import { ServiceProviderCategories } from '../consts'
import { useSearchServiceProviders } from './useSearchServiceProviders'
import { useFiatSourceAmount } from './useFiatSourceAmount'

export const useCreateCryptoQuote = ({
  enabled: enabledCreateCryptoQuote,
  category,
  countryCode,
  walletAddress,
  destinationCurrencyCode,
  sourceCurrencyCode,
  paymentMethodType
}: CreateCryptoQuoteParams & {
  category: ServiceProviderCategories
  enabled?: boolean
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
    isSourceAmountValid &&
    hasDestinationCurrencyCode &&
    hasSourceCurrencyCode &&
    Boolean(serviceProviders?.length) &&
    enabledCreateCryptoQuote

  return useQuery<CreateCryptoQuote | undefined>({
    enabled,
    queryKey: [
      ReactQueryKeys.MELD_CREATE_CRYPTO_QUOTE,
      category,
      serviceProviders,
      countryCode,
      walletAddress,
      sourceAmount,
      destinationCurrencyCode,
      sourceCurrencyCode,
      hasValidSourceAmount,
      paymentMethodType
    ],
    // Don't fan this out into one request per provider. Meld does not
    // fail-fast the batch when a single provider rejects: retested 11 Aug 2026
    // across 12 countries, the batch returns the union of whatever providers
    // could quote even when another hard-rejects with INCOMPATIBLE_REQUEST. The
    // whole-request 400 only happens when no provider can quote. Fanning out
    // instead loses quotes, because a provider rate-limited with a 429 gets
    // dropped where the batch would have returned it.
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
