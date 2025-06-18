import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import MeldService from '../services/MeldService'
import { CreateCryptoQuote, CreateCryptoQuoteParams } from '../types'
import { ServiceProviderCategories } from '../consts'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export const useCreateCryptoQuote = ({
  countryCode,
  enabled,
  walletAddress,
  sourceAmount,
  destinationCurrencyCode,
  sourceCurrencyCode
}: CreateCryptoQuoteParams & { enabled: boolean }): UseQueryResult<
  CreateCryptoQuote | undefined,
  Error
> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )

  return useQuery<CreateCryptoQuote | undefined>({
    enabled,
    queryKey: [
      ReactQueryKeys.MELD_CREATE_CRYPTO_QUOTE,
      serviceProviders,
      countryCode,
      walletAddress,
      sourceAmount,
      destinationCurrencyCode,
      sourceCurrencyCode
    ],
    queryFn: () =>
      MeldService.createCryptoQuote({
        serviceProviders,
        walletAddress,
        sourceAmount,
        countryCode,
        destinationCurrencyCode,
        sourceCurrencyCode
      }),
    staleTime: 1000 * 60 * 1 // 1 minute
  })
}
