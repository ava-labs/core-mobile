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
    queryFn: async () => {
      const baseBody = {
        walletAddress,
        sourceAmount,
        countryCode,
        destinationCurrencyCode,
        sourceCurrencyCode,
        paymentMethodType
      }

      // Batching quotes fine, but Meld reports one provider's error as the
      // error for the whole batch, so failures become unattributable.
      const providers =
        serviceProviders && serviceProviders.length > 0
          ? serviceProviders
          : [undefined]

      const settled = await Promise.allSettled(
        providers.map(sp =>
          MeldService.createCryptoQuote({
            ...baseBody,
            serviceProviders: sp ? [sp] : undefined
          })
        )
      )

      const quotes = settled.flatMap(result =>
        result.status === 'fulfilled' ? result.value?.quotes ?? [] : []
      )

      if (quotes.length > 0) {
        return { quotes }
      }

      // No provider returned a quote. Re-throw the first rejection so the query
      // resolves to an error rather than an empty-but-successful result.
      const firstRejection = settled.find(
        (r): r is PromiseRejectedResult => r.status === 'rejected'
      )
      if (firstRejection) {
        throw firstRejection.reason
      }
      return { quotes: [] }
    },
    staleTime: 1000 * 60 * 1 // 1 minute
  })
}
