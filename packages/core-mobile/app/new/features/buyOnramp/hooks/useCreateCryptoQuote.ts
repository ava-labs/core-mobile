import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { PaymentMethods, ServiceProviders } from '../consts'
import MeldService from '../services/MeldService'
import { useLocale } from './useLocale'

export type CreateCryptoQuoteParams = {
  walletAddress?: string
  sourceAmount: number
  sourceCurrencyCode: string
  destinationCurrencyCode: string
  countryCode: string
  paymentMethodType?: PaymentMethods
  subdivision?: string
}

export type Quote = {
  transactionType: string
  sourceAmount: number
  sourceAmountWithoutFees: number
  fiatAmountWithoutFees: number
  destinationAmountWithoutFees?: number
  sourceCurrencyCode: string
  countryCode: string
  totalFee: number
  networkFee: number
  transactionFee: number
  destinationAmount: number
  destinationCurrencyCode: string
  exchangeRate: number
  paymentMethodType: PaymentMethods
  serviceProvider: ServiceProviders
  customerScore: number
  institutionName?: string
  lowKyc: boolean
  partnerFee: number
}

export type CreateCryptoQuoteResponse = {
  quotes: Quote[]
  message?: string
  error?: string
  timestamp?: string
}

export const useCreateCryptoQuote = ({
  walletAddress,
  sourceAmount,
  destinationCurrencyCode,
  sourceCurrencyCode
}: Omit<CreateCryptoQuoteParams, 'countryCode'>): UseQueryResult<
  CreateCryptoQuoteResponse | undefined,
  Error
> => {
  const { countryCode } = useLocale()

  return useQuery<CreateCryptoQuoteResponse | undefined>({
    enabled: sourceAmount > 0 && destinationCurrencyCode !== '',
    queryKey: [
      'meld',
      'createCryptoQuote',
      countryCode,
      walletAddress,
      sourceAmount,
      destinationCurrencyCode,
      sourceCurrencyCode
    ],
    queryFn: () =>
      MeldService.createCryptoQuote({
        walletAddress,
        sourceAmount,
        countryCode,
        destinationCurrencyCode,
        sourceCurrencyCode
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
