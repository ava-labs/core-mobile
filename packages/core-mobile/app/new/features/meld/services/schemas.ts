import { object, record, string, number, z, boolean } from 'zod'
import {
  PaymentMethods,
  PaymentTypes,
  ServiceProviderCategories,
  ServiceProviders
} from '../consts'
import { SessionTypes } from '../types'

export const SearchCountrySchema = object({
  countryCode: string().optional().nullable(),
  name: string().optional().nullable(),
  flagImageUrl: string().optional().nullable(),
  regions: string().array().optional().nullable()
}).passthrough()

export const SearchFiatCurrencySchema = object({
  countryCode: string().optional().nullable(),
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
  defaultAmount: number().optional(),
  minimumAmount: number().optional(),
  maximumAmount: number().optional()
}).passthrough()

export const GetPurchaseLimitsSchema = object({
  countryCode: string().optional().nullable(),
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
  countryCode: string(),
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

export const CreateSessionWidgetSchema = object({
  id: string().optional().nullable(),
  externalSessionId: string().optional().nullable(),
  externalCustomerId: string().optional().nullable(),
  customerId: string().optional().nullable(),
  widgetUrl: string().optional().nullable()
}).passthrough()
