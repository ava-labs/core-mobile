import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { selectIsEnableMeldSandboxBlocked } from 'store/posthog/slice'
import { useSelector } from 'react-redux'
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
  const isSandboxBlocked = useSelector(selectIsEnableMeldSandboxBlocked)
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
    enabledCreateCryptoQuote

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
      paymentMethodType,
      isSandboxBlocked
    ],
    queryFn: () => {
      return MeldService.createCryptoQuote({
        sandbox: !isSandboxBlocked,
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
