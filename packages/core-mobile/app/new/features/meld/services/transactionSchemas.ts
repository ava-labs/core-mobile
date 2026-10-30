import { object, string, number, z, boolean } from 'zod'

export const CreateCryptoQuoteBodySchema = object({
  serviceProviders: string().array().optional(),
  walletAddress: string().optional(),
  sourceAmount: number().optional(),
  sourceCurrencyCode: string(),
  destinationCurrencyCode: string(),
  countryCode: string().optional().nullable(),
  paymentMethodType: string().optional(),
  subdivision: string().optional()
})

export const QuoteSchema = object({
  transactionType: string().optional().nullable(),
  sourceAmount: number().optional().nullable(),
  sourceAmountWithoutFees: number().optional().nullable(),
  fiatAmountWithoutFees: number().optional().nullable(),
  destinationAmountWithoutFees: number().optional().nullable(),
  sourceCurrencyCode: string().optional().nullable(),
  countryCode: string().optional().nullable(),
  totalFee: number().optional().nullable(),
  networkFee: number().nullable().optional(),
  transactionFee: number().optional().nullable(),
  destinationAmount: number().optional().nullable(),
  destinationCurrencyCode: string().optional().nullable(),
  exchangeRate: number().optional().nullable(),
  paymentMethodType: string().optional().nullable(),
  serviceProvider: string().optional().nullable(),
  customerScore: number().optional().nullable(),
  institutionName: string().optional().nullable(),
  lowKyc: boolean().optional().nullable(),
  partnerFee: number().optional().nullable()
}).passthrough()

export const CreateCryptoQuoteSchema = object({
  quotes: z.array(QuoteSchema).optional().nullable(),
  message: string().optional().nullable(),
  error: string().optional().nullable(),
  timestamp: string().optional().nullable()
}).passthrough()

export const SessionDataSchema = object({
  serviceProvider: string().optional().nullable(),
  redirectFlow: boolean().optional().nullable(),
  redirectUrl: string().optional().nullable(),
  countryCode: string().optional().nullable(),
  sourceCurrencyCode: string().optional().nullable(),
  destinationCurrencyCode: string().optional().nullable(),
  paymentMethodType: string().optional().nullable(),
  sourceAmount: number().optional().nullable(),
  walletAddress: string().optional().nullable()
}).passthrough()

export const CreateSessionWidgetBodySchema = object({
  sessionType: string(),
  sessionData: SessionDataSchema
})

export const CreateSessionWidgetSchema = object({
  id: string().optional().nullable(),
  externalSessionId: string().optional().nullable(),
  externalCustomerId: string().optional().nullable(),
  customerId: string().optional().nullable(),
  widgetUrl: string().optional().nullable()
}).passthrough()

export const CryptoDetailsSchema = object({
  sourceWalletAddress: string().optional().nullable(),
  destinationWalletAddress: string().optional().nullable(),
  networkFee: number().optional().nullable(),
  transactionFee: number().optional().nullable(),
  partnerFee: number().optional().nullable(),
  totalFee: number().optional().nullable(),
  networkFeeInUsd: number().optional().nullable(),
  transactionFeeInUsd: number().optional().nullable(),
  partnerFeeInUsd: number().optional().nullable(),
  totalFeeInUsd: number().optional().nullable(),
  blockchainTransactionId: string().optional().nullable(),
  chainId: string().optional().nullable()
}).passthrough()

export const MeldTransactionSchema = object({
  transaction: object({
    id: string().optional().nullable(),
    transactionType: string().optional().nullable(),
    sourceAmount: number().optional().nullable(),
    sourceCurrencyCode: string().optional().nullable(),
    destinationAmount: number().optional().nullable(),
    destinationCurrencyCode: string().optional().nullable(),
    serviceProviderDetails: object({
      details: object({
        status: string().optional().nullable(),
        fiatAmount: number().optional().nullable(),
        countryCode: string().optional().nullable(),
        cryptoAmount: number().optional().nullable(),
        cryptoCurrency: string().optional().nullable()
      }).passthrough(),
      type: string().optional().nullable()
    }).passthrough(),
    cryptoDetails: CryptoDetailsSchema.optional().nullable()
  }).passthrough()
}).passthrough()
