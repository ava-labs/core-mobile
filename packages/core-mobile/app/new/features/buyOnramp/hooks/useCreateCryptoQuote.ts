import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import MeldService from '../services/MeldService'
import { CreateCryptoQuote, CreateCryptoQuoteParams } from '../types'
import { ServiceProviderCategories } from '../consts'
import { useLocale } from './useLocale'
import { useSearchServiceProviders } from './useSearchServiceProviders'

export const useCreateCryptoQuote = ({
  walletAddress,
  sourceAmount,
  destinationCurrencyCode,
  sourceCurrencyCode
}: CreateCryptoQuoteParams): UseQueryResult<
  CreateCryptoQuote | undefined,
  Error
> => {
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const { countryCode } = useLocale()

  return useQuery<CreateCryptoQuote | undefined>({
    enabled:
      sourceAmount !== undefined &&
      sourceAmount > 0 &&
      destinationCurrencyCode !== '',
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
      })
  })
}
