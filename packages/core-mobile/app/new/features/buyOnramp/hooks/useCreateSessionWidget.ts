import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { CreateSessionWidget, CreateSessionWidgetParams } from '../types'
import MeldService from '../services/MeldService'
import { useLocale } from './useLocale'

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

  const enabled =
    walletAddress !== undefined &&
    sourceAmount !== null &&
    sourceAmount !== undefined &&
    sourceAmount > 0 &&
    sourceCurrencyCode !== '' &&
    destinationCurrencyCode !== '' &&
    sessionType !== undefined &&
    serviceProvider !== undefined

  return useQuery<CreateSessionWidget | undefined>({
    enabled,
    queryKey: [
      ReactQueryKeys.MELD_CREATE_SESSION_WIDGET,
      countryCode,
      walletAddress,
      sourceAmount,
      destinationCurrencyCode,
      sourceCurrencyCode,
      redirectUrl,
      sessionType,
      serviceProvider
    ],
    queryFn: () =>
      MeldService.createSessionWidget({
        sessionType,
        sessionData: {
          walletAddress,
          sourceAmount,
          countryCode,
          destinationCurrencyCode,
          sourceCurrencyCode,
          redirectUrl,
          serviceProvider
        }
      }),
    staleTime: 0 // widget url is only valid for one time use, we should always fetch a new one
  })
}
