import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { SearchProviderCategories } from 'services/meld/consts'
import MeldService from 'services/meld/MeldService'
import { CurrencySymbol } from 'store/settings/currency'
import { useLocale } from './useLocale'

export type GetPurchaseLimitsParams = {
  categories: SearchProviderCategories[]
  serviceProviders?: string[]
  accountFilter?: boolean
  fiatCurrencies?: CurrencySymbol[]
  includeDetails?: boolean
  cryptoCurrencyCodes?: string[]
}

type AmountDetails = {
  defaultAmount?: number
  minimumAmount: number
  maximumAmount: number
}

export type GetPurchaseLimitsResponse = {
  currencyCode: string
  chainCode?: string
  defaultAmount?: number
  minimumAmount: number
  maximumAmount: number
  meldDetails?: AmountDetails
  serviceProviderDetails?: Record<string, AmountDetails>
}

export const useGetPurchaseLimits = ({
  categories,
  fiatCurrencies,
  includeDetails,
  cryptoCurrencyCodes
}: GetPurchaseLimitsParams): UseQueryResult<
  GetPurchaseLimitsResponse[],
  Error
> => {
  const { countryCode } = useLocale()
  return useQuery({
    queryKey: [
      'meld',
      'getPurchaseLimits',
      categories,
      countryCode,
      fiatCurrencies,
      includeDetails,
      cryptoCurrencyCodes
    ],
    queryFn: () =>
      MeldService.getPurchaseLimits({
        categories,
        countries: [countryCode],
        fiatCurrencies,
        includeDetails,
        cryptoCurrencyCodes
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
