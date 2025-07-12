import { object, record, string, number, z, boolean } from 'zod'
import {
  PaymentMethods,
  PaymentTypes,
  ServiceProviderCategories,
  ServiceProviders
} from '../consts'
import { SessionTypes } from '../types'

export const RegionSchema = z.object({
  regionCode: string().optional().nullable(),
  name: string().optional().nullable()
})

export const SearchCountrySchema = object({
  countryCode: string().optional().nullable(),
  name: string().optional().nullable(),
  flagImageUrl: string().optional().nullable(),
  regions: RegionSchema.array().optional().nullable()
}).passthrough()

export const SearchFiatCurrencySchema = object({
  currencyCode: string().optional().nullable(),
  name: string().optional().nullable(),
  symbolImageUrl: string().optional().nullable()
}).passthrough()

export const SearchCryptoCurrencySchema = object({
  currencyCode: string().nullable().optional(),
  name: string().nullable().optional(),
  chainCode: string().nullable().optional(),
  chainName: string().nullable().optional(),
  chainId: string().nullable().optional(),
  contractAddress: string().nullable().optional(),
  symbolImageUrl: string().nullable().optional()
}).passthrough()

export const SearchServiceProviderSchema = object({
  serviceProvider: z.nativeEnum(ServiceProviders),
  name: string().optional().nullable(),
  status: string().optional().nullable(),
  categories: z
    .nativeEnum(ServiceProviderCategories)
    .array()
    .optional()
    .nullable(),
  categoryStatuses: record(z.nativeEnum(ServiceProviderCategories), string())
    .optional()
    .nullable(),
  websiteUrl: string().optional().nullable(),
  customerSupportUrl: string().optional().nullable(),
  logos: object({
    dark: string().optional().nullable(),
    light: string().optional().nullable(),
    darkShort: string().optional().nullable(),
    lightShort: string().optional().nullable()
  })
}).passthrough()

export const SearchDefaultsByCountrySchema = object({
  countryCode: string().optional().nullable(),
  defaultCurrencyCode: string().optional().nullable(),
  defaultPaymentMethods: z
    .nativeEnum(PaymentMethods)
    .array()
    .optional()
    .nullable()
}).passthrough()

const AmountDetailsSchema = object({
  defaultAmount: number().optional().nullable(),
  minimumAmount: number().optional().nullable(),
  maximumAmount: number().optional().nullable()
}).passthrough()

export const GetTradeLimitsSchema = object({
  currencyCode: string().optional().nullable(),
  chainCode: string().optional().nullable(),
  defaultAmount: number().optional().nullable(),
  minimumAmount: number().optional().nullable(),
  maximumAmount: number().optional().nullable(),
  meldDetails: AmountDetailsSchema.optional().nullable(),
  serviceProviderDetails: record(
    z.nativeEnum(ServiceProviders),
    AmountDetailsSchema
  )
    .optional()
    .nullable()
}).passthrough()

export const SearchPaymentMethodsSchema = object({
  paymentMethod: z.nativeEnum(PaymentMethods).optional().nullable(),
  name: string().optional().nullable(),
  paymentType: z.nativeEnum(PaymentTypes).optional().nullable(),
  logos: object({
    dark: string().optional().nullable(),
    light: string().optional().nullable()
  })
}).passthrough()

export const CreateCryptoQuoteBodySchema = object({
  serviceProviders: z.nativeEnum(ServiceProviders).array().optional(),
  walletAddress: string().optional(),
  sourceAmount: number().optional(),
  sourceCurrencyCode: string(),
  destinationCurrencyCode: string(),
  countryCode: string().optional().nullable(),
  paymentMethodType: z.nativeEnum(PaymentMethods).optional(),
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
  paymentMethodType: z.nativeEnum(PaymentMethods).optional().nullable(),
  serviceProvider: z.nativeEnum(ServiceProviders).optional().nullable(),
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
  serviceProvider: z.nativeEnum(ServiceProviders).optional().nullable(),
  redirectFlow: boolean().optional().nullable(),
  redirectUrl: string().optional().nullable(),
  countryCode: string().optional().nullable(),
  sourceCurrencyCode: string().optional().nullable(),
  destinationCurrencyCode: string().optional().nullable(),
  paymentMethodType: z.nativeEnum(PaymentMethods).optional().nullable(),
  sourceAmount: number().optional().nullable(),
  walletAddress: string().optional().nullable()
}).passthrough()

export const CreateSessionWidgetBodySchema = object({
  sessionType: z.nativeEnum(SessionTypes),
  sessionData: SessionDataSchema
})

export const StatusHistorySchema = object({
  status: string().optional().nullable(),
  message: string().optional().nullable(),
  createdAt: string().optional().nullable(),
  partnerEventId: string().optional().nullable(),
  emailSentToUser: boolean().optional().nullable()
}).passthrough()

export const CreateSessionWidgetSchema = object({
  id: string().optional().nullable(),
  externalSessionId: string().optional().nullable(),
  externalCustomerId: string().optional().nullable(),
  customerId: string().optional().nullable(),
  widgetUrl: string().optional().nullable()
}).passthrough()

export const CustomerSchema = object({
  id: string().optional().nullable(),
  accountId: string().optional().nullable()
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
