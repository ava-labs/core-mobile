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

it('parses every captured network-partner shape including fields the app ignores', () => {
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

it('keeps the ignored fields of the realistic first items via passthrough', () => {
  const [partner] = NpPartnerSchema.array().parse(npPartners)
  expect(partner).toHaveProperty('capabilities')
  const { currencies } = NpCurrenciesResponseSchema.parse({
    currencies: npCryptoCurrencies
  })
  expect(currencies[0]).toHaveProperty('decimalPlaces')
})

it('rejects a partner without an id', () => {
  expect(() => NpPartnerSchema.parse({ name: 'x' })).toThrow()
})
