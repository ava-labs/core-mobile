import {
  npPartners,
  npCryptoCurrencies,
  npFiatCurrencies,
  npCountries,
  npDefaultsUs,
  npPaymentMethodsUs,
  npRoutesUsdBtc
} from './__fixtures__/networkPartner'
import {
  toServiceProvider,
  toCryptoCurrency,
  toFiatCurrency,
  toCountry,
  toDefaultsByCountry,
  toPaymentMethod,
  routesToPaymentMethods,
  routesToTradeLimits
} from './networkPartnerAdapters'
import { NpRoute } from './networkPartnerSchemas'

const mustFind = <T>(
  items: readonly T[],
  predicate: (item: T) => boolean
): T => {
  const item = items.find(predicate)
  if (item === undefined) throw new Error('fixture item missing')
  return item
}

describe('toServiceProvider', () => {
  it('maps the name and short logos', () => {
    const stripe = toServiceProvider(
      mustFind(npPartners, p => p.serviceProvider === 'STRIPE')
    )
    expect(stripe.serviceProvider).toBe('STRIPE')
    expect(stripe.name).toBe('Stripe')
    expect(stripe.logos.darkShort).toMatch(/^https:\/\//)
    expect(stripe.logos.lightShort).toMatch(/^https:\/\//)
  })

  it('falls back to null when logos are missing', () => {
    expect(toServiceProvider({ serviceProvider: 'X' })).toEqual({
      serviceProvider: 'X',
      name: null,
      logos: { darkShort: null, lightShort: null }
    })
  })
})

describe('toCryptoCurrency', () => {
  it('restores chainName and renames contract', () => {
    const avaxc = toCryptoCurrency(
      mustFind(npCryptoCurrencies, c => c.currencyCode === 'AVAXC')
    )
    expect(avaxc).toMatchObject({
      chainCode: 'AVAXC',
      chainName: 'Avalanche C-Chain',
      chainId: '43114',
      contractAddress: '0x0000000000000000000000000000000000000000'
    })
  })

  it('keeps non-numeric chain ids and falls back to chainCode for unknown chains', () => {
    const btc = toCryptoCurrency(
      mustFind(npCryptoCurrencies, c => c.currencyCode === 'BTC')
    )
    expect(btc.chainId).toMatch(/^bip122:/)
    expect(
      toCryptoCurrency({ currencyCode: 'X', chainCode: 'NEWCHAIN' }).chainName
    ).toBe('NEWCHAIN')
    expect(toCryptoCurrency({ currencyCode: 'X' }).chainName).toBeNull()
  })
})

describe('toCountry / toFiatCurrency / toDefaultsByCountry / toPaymentMethod', () => {
  it('maps the renamed fields', () => {
    const us = toCountry(mustFind(npCountries, c => c.countryCode === 'US'))
    expect(us).toEqual({ countryCode: 'US', name: 'United States' })
    expect(
      toFiatCurrency(mustFind(npFiatCurrencies, c => c.currencyCode === 'USD'))
    ).toEqual({ currencyCode: 'USD', name: 'US Dollar' })
    expect(toDefaultsByCountry(npDefaultsUs, 'US')).toEqual({
      countryCode: 'US',
      defaultPaymentMethods: [
        'CREDIT_DEBIT_CARD',
        'APPLE_PAY',
        'ROBINHOOD_BUYING_POWER'
      ]
    })
    expect(toPaymentMethod(mustFind(npPaymentMethodsUs, () => true))).toEqual({
      paymentMethod: 'ACH',
      logos: {
        dark: 'https://cdn.meld.io/images-paymentmethod/ACH/logo_dark.png',
        light: 'https://cdn.meld.io/images-paymentmethod/ACH/logo_light.png'
      }
    })
  })
})

describe('routesToPaymentMethods', () => {
  it('unions methods across partners in first-seen order without duplicates', () => {
    const methods = routesToPaymentMethods(npRoutesUsdBtc).map(
      m => m.paymentMethod
    )
    expect(new Set(methods).size).toBe(methods.length)
    expect(methods).toContain('CREDIT_DEBIT_CARD')
  })
})

describe('routesToTradeLimits', () => {
  it('returns the envelope across all partners and methods', () => {
    const [limit] = routesToTradeLimits(npRoutesUsdBtc, { currencyCode: 'USD' })
    const all = npRoutesUsdBtc.flatMap(r => r.paymentMethods.map(m => m.limits))
    expect(limit).toEqual({
      currencyCode: 'USD',
      minimumAmount: Math.min(...all.map(l => l.min)),
      maximumAmount: Math.max(...all.map(l => l.max))
    })
  })

  it('narrows to the chosen payment method', () => {
    const [limit] = routesToTradeLimits(npRoutesUsdBtc, {
      currencyCode: 'USD',
      paymentMethod: 'ACH'
    })
    expect(limit).toEqual({
      currencyCode: 'USD',
      minimumAmount: 10.83,
      maximumAmount: 16133
    })
  })

  it('falls back to all methods when the chosen one is not listed', () => {
    const [limit] = routesToTradeLimits(npRoutesUsdBtc, {
      currencyCode: 'USD',
      paymentMethod: 'PIX'
    })
    expect([limit]).toEqual(
      routesToTradeLimits(npRoutesUsdBtc, { currencyCode: 'USD' })
    )
    expect(limit).toMatchObject({
      minimumAmount: 7.78,
      maximumAmount: 111185.7
    })
  })

  describe('limit sanity', () => {
    const routeWith = (
      ...methods: { name: string; limits?: unknown }[]
    ): NpRoute[] => [{ partner: 'P', paymentMethods: methods }] as NpRoute[]
    const limits = (
      min: number | null,
      max: number | null,
      currencyCode?: string
    ) => ({
      currencyCode,
      min,
      max
    })
    const run = (routes: NpRoute[]): ReturnType<typeof routesToTradeLimits> =>
      routesToTradeLimits(routes, { currencyCode: 'USD' })

    it('skips methods without limits or with a null bound', () => {
      expect(
        run(routeWith({ name: 'A' }, { name: 'B', limits: limits(null, 10) }))
      ).toEqual([])
    })

    it('rejects zero, inverted and negative ranges', () => {
      expect(run(routeWith({ name: 'A', limits: limits(0, 0) }))).toEqual([])
      expect(run(routeWith({ name: 'A', limits: limits(500, 100) }))).toEqual(
        []
      )
      expect(run(routeWith({ name: 'A', limits: limits(-5, 100) }))).toEqual([])
    })

    it('excludes a method priced in another currency and keeps its sibling', () => {
      const [limit] = run(
        routeWith(
          { name: 'A', limits: limits(1, 2, 'EUR') },
          { name: 'B', limits: limits(10, 20, 'USD') }
        )
      )
      expect(limit).toMatchObject({ minimumAmount: 10, maximumAmount: 20 })
    })
  })

  it('returns [] for an empty route list', () => {
    expect(routesToTradeLimits([], { currencyCode: 'USD' })).toEqual([])
  })
})
