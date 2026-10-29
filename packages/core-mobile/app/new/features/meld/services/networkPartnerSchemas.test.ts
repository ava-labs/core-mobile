import {
  npPartners,
  npCryptoCurrencies,
  npCountries,
  npDefaultsUs,
  npPaymentMethodsUs,
  npRoutesUsdAvaxc
} from './__fixtures__/networkPartner'
import {
  NpPartnerSchema,
  NpCurrenciesResponseSchema,
  NpCountriesResponseSchema,
  NpDefaultsSchema,
  NpPaymentMethodSchema,
  NpRouteSchema
} from './networkPartnerSchemas'

it('parses every captured network-partner shape', () => {
  expect(NpPartnerSchema.array().parse(npPartners)).toHaveLength(
    npPartners.length
  )
  expect(
    NpCurrenciesResponseSchema.parse({ currencies: npCryptoCurrencies })
      .currencies[0]?.currencyCode
  ).toBeDefined()
  expect(
    NpCountriesResponseSchema.parse({ countries: npCountries }).countries[0]
      ?.countryCode
  ).toBeDefined()
  expect(NpDefaultsSchema.parse(npDefaultsUs).paymentMethods).toContain(
    'CREDIT_DEBIT_CARD'
  )
  expect(
    NpPaymentMethodSchema.array().parse(npPaymentMethodsUs)[0]?.method
  ).toBe('ACH')
  expect(NpRouteSchema.array().parse(npRoutesUsdAvaxc)[0]?.partner).toBe(
    'STRIPE'
  )
})

it('rejects a partner without an id', () => {
  expect(() => NpPartnerSchema.parse({ name: 'x' })).toThrow()
})
