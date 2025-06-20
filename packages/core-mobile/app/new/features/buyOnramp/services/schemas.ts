import { object, record, string, number, z, boolean } from 'zod'
import {
  PaymentMethods,
  PaymentTypes,
  ServiceProviderCategories,
  ServiceProviders
} from '../consts'

export const SearchCountrySchema = object({
  countryCode: string(),
  name: string(),
  flagImageUrl: string().nullable(),
  regions: string().array().nullable()
}).passthrough()

export const SearchFiatCurrencySchema = object({
  countryCode: string(),
  name: string(),
  symbolImageUrl: string().nullable()
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
  name: string(),
  status: string(),
  categories: z.nativeEnum(ServiceProviderCategories).array(),
  categoryStatuses: record(z.nativeEnum(ServiceProviderCategories), string()),
  websiteUrl: string().nullable(),
  customerSupportUrl: string().nullable(),
  logos: object({
    dark: string(),
    light: string(),
    darkShort: string(),
    lightShort: string()
  })
}).passthrough()

export const SearchDefaultsByCountrySchema = object({
  countryCode: string(),
  defaultCurrencyCode: string(),
  defaultPaymentMethods: z.nativeEnum(PaymentMethods).array()
}).passthrough()

const AmountDetailsSchema = object({
  defaultAmount: number().optional(),
  minimumAmount: number(),
  maximumAmount: number()
})

export const GetPurchaseLimitsSchema = object({
  countryCode: string().optional(),
  chainCode: string().optional(),
  defaultAmount: number().optional(),
  minimumAmount: number(),
  maximumAmount: number(),
  meldDetails: AmountDetailsSchema.optional(),
  serviceProviderDetails: record(
    z.nativeEnum(ServiceProviders),
    AmountDetailsSchema
  ).optional()
}).passthrough()

export const SearchPaymentMethodsSchema = object({
  paymentMethod: z.nativeEnum(PaymentMethods),
  name: string(),
  paymentType: z.nativeEnum(PaymentTypes),
  logos: object({
    dark: string(),
    light: string()
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
}).passthrough()

export const QuoteSchema = object({
  transactionType: string(),
  sourceAmount: number(),
  sourceAmountWithoutFees: number(),
  fiatAmountWithoutFees: number(),
  destinationAmountWithoutFees: number().optional().nullable(),
  sourceCurrencyCode: string(),
  countryCode: string(),
  totalFee: number(),
  networkFee: number().nullable().optional(),
  transactionFee: number(),
  destinationAmount: number(),
  destinationCurrencyCode: string(),
  exchangeRate: number(),
  paymentMethodType: z.nativeEnum(PaymentMethods),
  serviceProvider: z.nativeEnum(ServiceProviders),
  customerScore: number(),
  institutionName: string().optional().nullable(),
  lowKyc: boolean(),
  partnerFee: number()
})

export const CreateCryptoQuoteSchema = object({
  quotes: z.array(QuoteSchema),
  message: string().optional().nullable(),
  error: string().optional().nullable(),
  timestamp: string().optional().nullable()
})
