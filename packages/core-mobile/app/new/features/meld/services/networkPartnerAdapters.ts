import {
  Country,
  CryptoCurrency,
  FiatCurrency,
  GetTradeLimits,
  SearchDefaultsByCountry,
  SearchPaymentMethods,
  ServiceProvider
} from '../types'
import { getMeldChainName } from './meldChainNames'
import {
  NpCountry,
  NpCurrency,
  NpDefaults,
  NpPartner,
  NpPaymentMethod,
  NpRoute,
  NpRoutePaymentMethod
} from './networkPartnerSchemas'

const asArray = <T>(value: T[] | null | undefined): T[] =>
  Array.isArray(value) ? value : []

const toLogos = (
  logo: { dark?: string | null; light?: string | null } | null | undefined
): { dark?: string | null; light?: string | null } => ({
  dark: logo?.dark,
  light: logo?.light
})

export const toServiceProvider = (np: NpPartner): ServiceProvider => ({
  serviceProvider: np.serviceProvider,
  name: np.name,
  status: np.status,
  categories: np.categories,
  categoryStatuses: Array.isArray(np.capabilities)
    ? Object.fromEntries(
        np.capabilities.flatMap(c =>
          c.category && c.status ? [[c.category, c.status]] : []
        )
      )
    : null,
  websiteUrl: np.url,
  customerSupportUrl: null,
  logos: {
    dark: np.logo?.dark ?? null,
    light: np.logo?.light ?? null,
    darkShort: np.logo?.darkShort ?? null,
    lightShort: np.logo?.lightShort ?? null
  }
})

export const toCryptoCurrency = (np: NpCurrency): CryptoCurrency => ({
  currencyCode: np.currencyCode,
  name: np.name,
  chainCode: np.chainCode,
  chainName:
    (np.chainCode ? getMeldChainName(np.chainCode) : undefined) ??
    np.chainCode ??
    null,
  chainId: np.chainId,
  contractAddress: np.contract,
  symbolImageUrl: np.symbol
})

export const toFiatCurrency = (np: NpCurrency): FiatCurrency => ({
  currencyCode: np.currencyCode,
  name: np.name,
  symbolImageUrl: np.symbol
})

export const toCountry = (np: NpCountry): Country => ({
  countryCode: np.countryCode,
  name: np.name,
  flagImageUrl: np.flag,
  regions: asArray(np.subdivisions).map(code => ({
    regionCode: code,
    name: code
  }))
})

export const toDefaultsByCountry = (
  np: NpDefaults
): SearchDefaultsByCountry => ({
  countryCode: np.countryCode,
  defaultCurrencyCode: np.currencyCode,
  defaultPaymentMethods: np.paymentMethods ?? []
})

export const toPaymentMethod = (np: NpPaymentMethod): SearchPaymentMethods => ({
  paymentMethod: np.method,
  name: np.name,
  paymentType: np.type,
  logos: toLogos(np.logo)
})

export const routesToPaymentMethods = (
  routes: NpRoute[]
): SearchPaymentMethods[] => {
  const seen = new Set<string>()
  const result: SearchPaymentMethods[] = []
  for (const route of routes) {
    for (const method of asArray(route.paymentMethods)) {
      if (seen.has(method.name)) continue
      seen.add(method.name)
      result.push({
        paymentMethod: method.name,
        name: method.name,
        paymentType: method.paymentType,
        logos: toLogos(method.logo)
      })
    }
  }
  return result
}

type Limits = { min: number; max: number }

const validLimits = (
  method: NpRoutePaymentMethod,
  currencyCode: string
): Limits | undefined => {
  const limits = method.limits
  if (!limits) return undefined
  const { min, max } = limits
  if (typeof min !== 'number' || typeof max !== 'number') return undefined
  if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined
  if (min < 0 || max <= 0 || min > max) return undefined
  if (limits.currencyCode && limits.currencyCode !== currencyCode)
    return undefined
  return { min, max }
}

type Entry = { name: string; limits: Limits }

const toRange = (
  entries: Entry[]
): { minimumAmount: number; maximumAmount: number } | undefined => {
  if (entries.length === 0) return undefined
  return {
    minimumAmount: Math.min(...entries.map(e => e.limits.min)),
    maximumAmount: Math.max(...entries.map(e => e.limits.max))
  }
}

export const routesToTradeLimits = (
  routes: NpRoute[],
  params: { currencyCode: string; paymentMethod?: string }
): GetTradeLimits[] => {
  const candidates = routes.map(route => {
    const all = asArray(route.paymentMethods).flatMap(m => {
      const limits = validLimits(m, params.currencyCode)
      return limits ? [{ name: m.name, limits }] : []
    })
    return { partner: route.partner, all }
  })
  const hasChosen = candidates.some(c =>
    c.all.some(m => m.name === params.paymentMethod)
  )
  const pick = (entries: Entry[]): Entry[] =>
    hasChosen ? entries.filter(m => m.name === params.paymentMethod) : entries

  const overall = toRange(candidates.flatMap(c => pick(c.all)))
  if (!overall) return []

  const serviceProviderDetails: NonNullable<
    GetTradeLimits['serviceProviderDetails']
  > = {}
  for (const { partner, all } of candidates) {
    const range = toRange(pick(all))
    if (range)
      serviceProviderDetails[partner] = { ...range, defaultAmount: null }
  }

  return [
    {
      currencyCode: params.currencyCode,
      ...overall,
      defaultAmount: null,
      meldDetails: null,
      chainCode: null,
      serviceProviderDetails
    }
  ]
}
