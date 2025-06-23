import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'
import MeldService from '../services/MeldService'
import { CreateCryptoQuote, CreateCryptoQuoteParams } from '../types'
import { ServiceProviderCategories } from '../consts'
import { useOnRampPaymentMethod, useOnRampToken } from '../store'
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
  const [onRampToken] = useOnRampToken()
  const [onRampPaymentMethod] = useOnRampPaymentMethod()
  const { data: serviceProvidersData } = useSearchServiceProviders({
    categories: [ServiceProviderCategories.CRYPTO_ONRAMP]
  })
  const serviceProviders = serviceProvidersData?.map(
    serviceProvider => serviceProvider.serviceProvider
  )
  const { hasValidSourceAmount, sourceAmount } = useSourceAmount()

  return useQuery<CreateCryptoQuote | undefined>({
    queryKey: [
      ReactQueryKeys.MELD_CREATE_CRYPTO_QUOTE,
      serviceProviders,
      countryCode,
      walletAddress,
      sourceAmount,
      destinationCurrencyCode,
      sourceCurrencyCode,
      selectedCurrency,
      onRampToken?.currencyCode,
      hasValidSourceAmount,
      onRampPaymentMethod
    ],
    queryFn: () => {
      const hasValidCountry = countryCode !== undefined
      const hasSelectedCurrency = selectedCurrency !== undefined
      const hasDestinationCurrencyCode =
        onRampToken?.currencyCode !== '' &&
        onRampToken?.currencyCode !== undefined

      if (
        hasValidCountry &&
        hasSelectedCurrency &&
        hasValidSourceAmount &&
        hasDestinationCurrencyCode
      ) {
        return MeldService.createCryptoQuote({
          serviceProviders,
          walletAddress,
          sourceAmount,
          countryCode,
          destinationCurrencyCode,
          sourceCurrencyCode,
          paymentMethodType: onRampPaymentMethod
        })
      }
    },
    staleTime: 1000 * 60 * 1 // 1 minute
  })
}
