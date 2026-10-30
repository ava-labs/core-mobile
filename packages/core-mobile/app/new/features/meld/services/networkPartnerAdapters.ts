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
): SearchPaymentMethods['logos'] => ({
  dark: logo?.dark ?? null,
  light: logo?.light ?? null
})

export const toServiceProvider = (np: NpPartner): ServiceProvider => ({
  serviceProvider: np.serviceProvider,
  name: np.name ?? null,
  logos: {
    darkShort: np.logo?.darkShort ?? null,
    lightShort: np.logo?.lightShort ?? null
  }
})

export const toCryptoCurrency = (np: NpCurrency): CryptoCurrency => ({
  currencyCode: np.currencyCode,
  name: np.name ?? null,
  chainCode: np.chainCode ?? null,
  chainName:
    (np.chainCode ? getMeldChainName(np.chainCode) : undefined) ??
    np.chainCode ??
    null,
  chainId: np.chainId ?? null,
  contractAddress: np.contract ?? null
})

export const toFiatCurrency = (np: NpCurrency): FiatCurrency => ({
  currencyCode: np.currencyCode,
  name: np.name ?? null
})

export const toCountry = (np: NpCountry): Country => ({
  countryCode: np.countryCode,
  name: np.name ?? null
})

export const toDefaultsByCountry = (
  np: NpDefaults,
  countryCode: string
): SearchDefaultsByCountry => ({
  countryCode,
  defaultPaymentMethods: np.paymentMethods ?? []
})

const toSearchPaymentMethod = (
  paymentMethod: string,
  logo: Parameters<typeof toLogos>[0]
): SearchPaymentMethods => ({ paymentMethod, logos: toLogos(logo) })

export const toPaymentMethod = (np: NpPaymentMethod): SearchPaymentMethods =>
  toSearchPaymentMethod(np.method, np.logo)

export const routesToPaymentMethods = (
  routes: NpRoute[]
): SearchPaymentMethods[] => {
  const seen = new Set<string>()
  const result: SearchPaymentMethods[] = []
  for (const route of routes) {
    for (const method of asArray(route.paymentMethods)) {
      if (seen.has(method.name)) continue
      seen.add(method.name)
      result.push(toSearchPaymentMethod(method.name, method.logo))
    }
  }
  return result
}

type Limits = { min: number; max: number }
type Entry = { name: string; limits: Limits }

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

const pickCandidateMethods = (
  routes: NpRoute[],
  currencyCode: string,
  paymentMethod?: string
): Entry[] => {
  const entries = routes.flatMap(route =>
    asArray(route.paymentMethods).flatMap(m => {
      const limits = validLimits(m, currencyCode)
      return limits ? [{ name: m.name, limits }] : []
    })
  )
  const chosen = entries.filter(e => e.name === paymentMethod)
  return chosen.length > 0 ? chosen : entries
}

export const routesToTradeLimits = (
  routes: NpRoute[],
  params: { currencyCode: string; paymentMethod?: string }
): GetTradeLimits[] => {
  const { currencyCode, paymentMethod } = params
  const entries = pickCandidateMethods(routes, currencyCode, paymentMethod)
  if (entries.length === 0) return []
  return [
    {
      currencyCode,
      minimumAmount: Math.min(...entries.map(e => e.limits.min)),
      maximumAmount: Math.max(...entries.map(e => e.limits.max))
    }
  ]
}
