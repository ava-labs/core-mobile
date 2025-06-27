import { useCallback } from 'react'
import { CreateSessionWidget, CreateSessionWidgetParams } from '../types'
import MeldService from '../services/MeldService'
import { useMeldPaymentMethod } from '../store'
import { ServiceProviderCategories } from '../consts'
import { useLocale } from './useLocale'
import { useFiatSourceAmount } from './useFiatSourceAmount'

export const useCreateSessionWidget = ({
  category,
  sessionType,
  sessionData: {
    walletAddress,
    sourceAmount,
    destinationCurrencyCode,
    sourceCurrencyCode,
    redirectUrl,
    serviceProvider
  }
}: CreateSessionWidgetParams & {
  category: ServiceProviderCategories
}): {
  createSessionWidget: () => Promise<CreateSessionWidget | undefined>
} => {
  const { countryCode } = useLocale()
  const [meldPaymentMethod] = useMeldPaymentMethod()
  const { hasValidSourceAmount } = useFiatSourceAmount({ category })

  const hasWalletAddress = walletAddress !== undefined && walletAddress !== null
  const hasSourceCurrencyCode =
    sourceCurrencyCode !== '' &&
    sourceCurrencyCode !== undefined &&
    sourceCurrencyCode !== null
  const hasDestinationCurrencyCode =
    destinationCurrencyCode !== '' &&
    destinationCurrencyCode !== undefined &&
    destinationCurrencyCode !== null
  const hasServiceProvider =
    serviceProvider !== undefined && serviceProvider !== null

  const shouldCreateSessionWidget =
    hasValidSourceAmount &&
    hasWalletAddress &&
    hasSourceCurrencyCode &&
    hasDestinationCurrencyCode &&
    hasServiceProvider

  const createSessionWidget = useCallback(async () => {
    if (shouldCreateSessionWidget === false) {
      return undefined
    }

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
        paymentMethodType: meldPaymentMethod
      }
    })
  }, [
    countryCode,
    destinationCurrencyCode,
    meldPaymentMethod,
    redirectUrl,
    serviceProvider,
    sessionType,
    shouldCreateSessionWidget,
    sourceAmount,
    sourceCurrencyCode,
    walletAddress
  ])

  return {
    createSessionWidget
  }
}
