import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { CreateSessionWidget, CreateSessionWidgetParams } from '../types'
import MeldService from '../services/MeldService'
import { useOnRampPaymentMethod } from '../store'
import { useLocale } from './useLocale'
import { useSourceAmount } from './useSourceAmount'

export const useCreateSessionWidget = ({
  sessionType,
  sessionData: {
    walletAddress,
    sourceAmount,
    destinationCurrencyCode,
    sourceCurrencyCode,
    redirectUrl,
    serviceProvider
  }
}: CreateSessionWidgetParams): UseQueryResult<
  CreateSessionWidget | undefined,
  Error
> => {
  const { countryCode } = useLocale()
  const [onRampPaymentMethod] = useOnRampPaymentMethod()
  const { hasValidSourceAmount } = useSourceAmount()

  return useQuery<CreateSessionWidget | undefined>({
    queryKey: [
      ReactQueryKeys.MELD_CREATE_SESSION_WIDGET,
      countryCode,
      walletAddress,
      sourceAmount,
      destinationCurrencyCode,
      sourceCurrencyCode,
      redirectUrl,
      sessionType,
      serviceProvider,
      hasValidSourceAmount,
      onRampPaymentMethod
    ],
    queryFn: () => {
      const hasWalletAddress = walletAddress !== undefined
      const hasSourceCurrencyCode = sourceCurrencyCode !== ''
      const hasDestinationCurrencyCode = destinationCurrencyCode !== ''
      const hasSessionType = sessionType !== undefined
      const hasServiceProvider = serviceProvider !== undefined

      const shouldCreateSessionWidget =
        hasWalletAddress &&
        hasSourceCurrencyCode &&
        hasDestinationCurrencyCode &&
        hasSessionType &&
        hasServiceProvider

      if (shouldCreateSessionWidget) {
        return MeldService.createSessionWidget({
          sessionType,
          sessionData: {
            walletAddress,
            sourceAmount,
            countryCode,
            destinationCurrencyCode,
            sourceCurrencyCode,
            redirectUrl,
            serviceProvider,
            paymentMethodType: onRampPaymentMethod
          }
        })
      }
    },
    staleTime: 0 // widget url is only valid for one time use, we should always fetch a new one
  })
}
