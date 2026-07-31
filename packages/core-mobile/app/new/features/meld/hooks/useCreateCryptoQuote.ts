import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useMemo } from 'react'
import MeldService from '../services/MeldService'
import { CreateCryptoQuote, CreateCryptoQuoteParams } from '../types'
import { ServiceProviderCategories, providerCryptoCode } from '../consts'
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
    // Gate on the provider list having resolved. Without this, an in-flight
    // useSearchServiceProviders leaves serviceProviders undefined, and the
    // fan-out below would send a single unfiltered (all-provider) request —
    // the exact batched shape that 400s when any provider is incompatible.
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

      // Fan out one quote request per provider. Meld's /payments/crypto/quote
      // fail-fasts the entire batch with a 400 (INCOMPATIBLE_REQUEST) when ANY
      // provider in the list rejects the request — e.g. a provider that does
      // not support the selected payment method (Mercuryo has no PIX). That
      // drops the valid quotes from every other provider. Quoting per-provider
      // isolates the failure so compatible providers still return quotes.
      const providers =
        serviceProviders && serviceProviders.length > 0
          ? serviceProviders
          : [undefined]

      const isOnramp = category === ServiceProviderCategories.CRYPTO_ONRAMP

      const settled = await Promise.allSettled(
        providers.map(sp => {
          // Meld codes the same crypto differently per provider; translate the
          // crypto-side code (destination for buy, source for sell) so each
          // provider is quoted with a code it recognises.
          const mappedCryptoCode = providerCryptoCode(
            isOnramp ? destinationCurrencyCode : sourceCurrencyCode,
            sp
          )
          return MeldService.createCryptoQuote({
            ...baseBody,
            ...(isOnramp
              ? {
                  destinationCurrencyCode:
                    mappedCryptoCode ?? destinationCurrencyCode
                }
              : { sourceCurrencyCode: mappedCryptoCode ?? sourceCurrencyCode }),
            serviceProviders: sp ? [sp] : undefined
          })
        })
      )

      const quotes = settled.flatMap(result =>
        result.status === 'fulfilled' ? result.value?.quotes ?? [] : []
      )

      if (quotes.length > 0) {
        return { quotes }
      }

      // No provider returned a quote. Re-throw the first rejection so the query
      // resolves to an error rather than an empty-but-successful result. (The
      // amount screen cannot show the message yet — fetchJson discards the
      // response body; surfacing it is a separate follow-up.)
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
