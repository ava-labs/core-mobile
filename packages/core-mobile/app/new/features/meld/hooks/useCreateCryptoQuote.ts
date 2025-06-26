import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import MeldService from '../services/MeldService'
import { CreateCryptoQuote, CreateCryptoQuoteParams } from '../types'
import { ServiceProviderCategories } from '../consts'
import { useOnrampPaymentMethod } from '../meldOnramp/store'
import { useSearchServiceProviders } from './useSearchServiceProviders'
import { useSourceAmount } from './useSourceAmount'

export const useCreateCryptoQuote = ({
  countryCode,
  walletAddress,
  destinationCurrencyCode,
  sourceCurrencyCode
}: CreateCryptoQuoteParams): UseQueryResult<
  CreateCryptoQuote | undefined,
  Error
> => {
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const [onRampPaymentMethod] = useOnrampPaymentMethod()
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const { hasValidSourceAmount, sourceAmount } = useSourceAmount()

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
      onRampPaymentMethod
    ],
    queryFn: () => {
      return MeldService.createCryptoQuote({
        serviceProviders,
        walletAddress,
        sourceAmount,
        countryCode,
        destinationCurrencyCode,
        sourceCurrencyCode,
        paymentMethodType: onRampPaymentMethod
      })
    },
    staleTime: 1000 * 60 * 1 // 1 minute
  })
}
