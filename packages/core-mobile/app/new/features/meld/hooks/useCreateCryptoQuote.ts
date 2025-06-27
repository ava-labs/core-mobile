import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import MeldService from '../services/MeldService'
import { CreateCryptoQuote, CreateCryptoQuoteParams } from '../types'
import { ServiceProviderCategories } from '../consts'
import { useMeldPaymentMethod } from '../store'
import { useSearchServiceProviders } from './useSearchServiceProviders'
import { useFiatSourceAmount } from './useFiatSourceAmount'

export const useCreateCryptoQuote = ({
  category,
  countryCode,
  walletAddress,
  destinationCurrencyCode,
  sourceCurrencyCode
}: CreateCryptoQuoteParams & {
  category: ServiceProviderCategories
}): UseQueryResult<CreateCryptoQuote | undefined, Error> => {
  const [meldPaymentMethod] = useMeldPaymentMethod()
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [category]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const { hasValidSourceAmount, sourceAmount } = useFiatSourceAmount({
    category
  })

  const hasDestinationCurrencyCode = destinationCurrencyCode !== ''
  const hasSourceCurrencyCode = sourceCurrencyCode !== ''

  const enabled =
    hasValidSourceAmount && hasDestinationCurrencyCode && hasSourceCurrencyCode

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
      meldPaymentMethod
    ],
    queryFn: () => {
      return MeldService.createCryptoQuote({
        serviceProviders,
        walletAddress,
        sourceAmount,
        countryCode,
        destinationCurrencyCode,
        sourceCurrencyCode,
        paymentMethodType: meldPaymentMethod
      })
    },
    staleTime: 1000 * 60 * 1 // 1 minute
  })
}
