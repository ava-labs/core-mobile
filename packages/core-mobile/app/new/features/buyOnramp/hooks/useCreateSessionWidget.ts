import { useCallback } from 'react'
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
}: CreateSessionWidgetParams): {
  createSessionWidget: () => Promise<CreateSessionWidget | undefined>
} => {
  const { countryCode } = useLocale()
  const [onRampPaymentMethod] = useOnRampPaymentMethod()
  const { hasValidSourceAmount } = useSourceAmount()

  const hasWalletAddress = walletAddress !== undefined
  const hasSourceCurrencyCode = sourceCurrencyCode !== ''
  const hasDestinationCurrencyCode = destinationCurrencyCode !== ''
  const hasSessionType = sessionType !== undefined
  const hasServiceProvider = serviceProvider !== undefined

  const shouldCreateSessionWidget =
    hasValidSourceAmount &&
    hasWalletAddress &&
    hasSourceCurrencyCode &&
    hasDestinationCurrencyCode &&
    hasSessionType &&
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
        paymentMethodType: onRampPaymentMethod
      }
    })
  }, [
    countryCode,
    destinationCurrencyCode,
    onRampPaymentMethod,
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
