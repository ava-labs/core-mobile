import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
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
  const selectedCurrency = useSelector(selectSelectedCurrency)
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

  const enabled = hasValidSourceAmount && hasDestinationCurrencyCode

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
      selectedCurrency,
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
