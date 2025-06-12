import { useQuery, UseQueryResult } from '@tanstack/react-query'
import MeldService from 'services/meld/MeldService'
import { PaymentMethods, ServiceProviders } from 'services/meld/consts'
import { useLocale } from './useLocale'

export type CreateCryptoQuoteParams = {
  customerId?: string
  externalCustomerId?: string
  walletAddress?: string
  sourceAmount: number
  sourceCurrencyCode: string
  destinationCurrencyCode: string
  countryCode: string
  paymentMethodType?: keyof typeof PaymentMethods
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
  paymentMethodType: keyof typeof PaymentMethods
  serviceProvider: keyof typeof ServiceProviders
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
  customerId,
  externalCustomerId,
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
      sourceCurrencyCode,
      customerId,
      externalCustomerId
    ],
    queryFn: () =>
      MeldService.createCryptoQuote({
        customerId,
        externalCustomerId,
        walletAddress,
        sourceAmount,
        countryCode,
        destinationCurrencyCode,
        sourceCurrencyCode
      }),
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}
