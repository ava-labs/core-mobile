import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'
import { ServiceProviders, SessionTypes } from '../consts'
import { CreateCryptoQuoteParams } from '../types'
import { useLocale } from './useLocale'

export type CreateCryptoWidgetParams = CreateCryptoQuoteParams & {
  externalSessionId?: string
  redirectUrl?: string
  sessionType: SessionTypes
  serviceProvider?: ServiceProviders
}

export type CreateCryptoWidgetResponse = {
  id: string
  externalSessionId?: string
  externalCustomerId?: string
  customerId?: string
  widgetUrl: string
}

export const useCreateCryptoWidget = ({
  customerId,
  externalCustomerId,
  externalSessionId,
  walletAddress,
  sourceAmount,
  destinationCurrencyCode,
  sourceCurrencyCode,
  redirectUrl,
  sessionType,
  serviceProvider
}: Omit<
  CreateCryptoWidgetParams,
  'countryCode' | 'subdivision'
>): UseQueryResult<CreateCryptoWidgetResponse | undefined, Error> => {
  const { countryCode } = useLocale()

  const enabled =
    walletAddress !== undefined &&
    sourceAmount !== undefined &&
    sourceAmount > 0 &&
    sourceCurrencyCode !== '' &&
    destinationCurrencyCode !== '' &&
    sessionType !== undefined &&
    serviceProvider !== undefined

  return useQuery<CreateCryptoWidgetResponse | undefined>({
    enabled,
    queryKey: [
      'meld',
      'createCryptoWidget',
      countryCode,
      walletAddress,
      sourceAmount,
      destinationCurrencyCode,
      sourceCurrencyCode,
      customerId,
      externalCustomerId,
      externalSessionId,
      redirectUrl,
      sessionType,
      serviceProvider
    ],
    queryFn: () =>
      MeldService.createCryptoWidget({
        customerId,
        externalCustomerId,
        externalSessionId,
        walletAddress,
        sourceAmount,
        countryCode,
        destinationCurrencyCode,
        sourceCurrencyCode,
        redirectUrl,
        sessionType,
        serviceProvider
      }),
    staleTime: 0 // widget url is only valid for one time use, we should always fetch a new one
  })
}
