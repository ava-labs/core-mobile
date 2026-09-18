import { useLocalSearchParams } from 'expo-router'
import {
  type OrderSide,
  type PlaceOrderProviderProps
} from '../contexts/PlaceOrderContext'
import { FALLBACK_COIN } from '../utils/economics'
import { normalizePerpCoinParam } from '../utils/coinDex'
import { toNumber as parseHlNumber } from '../utils/format'
import { useHyperliquidMarketContext } from './useHyperliquidMarketContext'
import { usePerpsActiveAssetData } from './usePerpsActiveAssetData'

export type SeededPlaceOrderProps = Omit<PlaceOrderProviderProps, 'children'>

export type SeedParams = {
  coin?: string
  side?: string
  price?: string
  entry?: string
  /**
   * Serialized `PerpUniverseEntry.maxLeverage` for the coin. At SDK-wiring
   * time the navigation that opens this flow should source it from the market
   * context's `universe?.maxLeverage` (the same field MarketDetailsHeader
   * displays), not a literal.
   */
  maxLeverage?: string
  leverage?: string
  size?: string
  tp?: string
  sl?: string
}

const toNumber = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

const toPositive = (value: string | undefined): number | undefined => {
  const n = toNumber(value)
  return n !== undefined && n > 0 ? n : undefined
}

/**
 * Pure resolver (testable without the router): builds `PlaceOrderProvider`
 * props from raw route params, sanitizing against malformed deep links.
 *  - open passes `price` + optional `maxLeverage`
 *  - manage passes `entry`, `leverage`, `size` and existing `tp` / `sl`
 */
export const resolveSeededPlaceOrderProps = (
  params: SeedParams
): SeededPlaceOrderProps => {
  // No fabricated fallbacks: an absent/invalid price or max leverage resolves
  // to 0 here and is filled in from live Hyperliquid market data by the hook.
  const entryPrice = toPositive(params.entry) ?? toPositive(params.price) ?? 0
  const maxLeverage = toNumber(params.maxLeverage) ?? 0
  const rawLeverage = toNumber(params.leverage)
  const leverageCap = maxLeverage > 0 ? maxLeverage : Number.POSITIVE_INFINITY
  // `0` until the coin's live HL leverage is applied (the open flow seeds it in
  // the place-order screen). The manage flow provides the position's leverage.
  const initialLeverage =
    rawLeverage !== undefined
      ? Math.min(Math.max(1, rawLeverage), leverageCap)
      : 0
  const size = Math.max(0, toNumber(params.size) ?? 0)

  return {
    coin: normalizePerpCoinParam(params.coin ?? FALLBACK_COIN),
    initialSide: (params.side === 'short' ? 'short' : 'long') as OrderSide,
    entryPrice,
    maxLeverage,
    initialLeverage,
    // Position notional in USD, used consistently by the amount dial and
    // trigger-screen projected P&L.
    initialAmount: entryPrice > 0 ? size * entryPrice : undefined,
    initialTakeProfitPrice: toPositive(params.tp),
    initialStopLossPrice: toPositive(params.sl)
  }
}

/**
 * Shared by the place-order (open) and manage (edit) modal layouts. Resolves
 * the deep-link params, then fills in the fields that must come from live
 * Hyperliquid data rather than fabricated defaults:
 *  - `maxLeverage` from the coin's market universe
 *  - `entryPrice` from the live mark price for the open flow (no `entry` param);
 *    the manage flow keeps the position's real entry price from the deep link.
 */
export const useSeededPlaceOrderProps = (): SeededPlaceOrderProps => {
  const params = useLocalSearchParams<SeedParams>()
  const resolved = resolveSeededPlaceOrderProps(params)
  const { universe, assetCtx } = useHyperliquidMarketContext(resolved.coin)
  const { leverageType } = usePerpsActiveAssetData(resolved.coin)

  const liveMaxLeverage = universe?.maxLeverage
  const liveMarkPrice = parseHlNumber(assetCtx?.markPx)
  // The manage flow carries the position's own entry price; only the open flow
  // (no `entry` param) should adopt the live mark price.
  const isOpenFlow = params.entry === undefined

  return {
    ...resolved,
    entryPrice:
      isOpenFlow && liveMarkPrice > 0 ? liveMarkPrice : resolved.entryPrice,
    maxLeverage:
      liveMaxLeverage !== undefined && liveMaxLeverage > 0
        ? liveMaxLeverage
        : resolved.maxLeverage,
    // Shared through PlaceOrderContext so the sheets in the stack (leverage,
    // margin mode) read this subscription instead of opening their own socket.
    universe,
    // HL's authoritative margin mode, undefined until BOTH queries resolve:
    // with the universe unresolved `onlyIsolated` would read false and an
    // isolated-only (HIP-3) market could briefly seed cross. The provider
    // seeds context `marginMode` from this before any sheet can commit.
    hlMarginMode:
      universe !== undefined && leverageType !== undefined
        ? universe.onlyIsolated === true
          ? 'isolated'
          : leverageType
        : undefined
  }
}
