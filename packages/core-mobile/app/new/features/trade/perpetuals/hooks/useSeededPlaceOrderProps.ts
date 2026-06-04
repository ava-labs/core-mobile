import { useLocalSearchParams } from 'expo-router'
import {
  type OrderSide,
  type PlaceOrderProviderProps
} from '../contexts/PlaceOrderContext'
import {
  DEFAULT_COIN,
  DEFAULT_ENTRY_PRICE,
  DEFAULT_MAX_LEVERAGE,
  MOCK_AVAILABLE_BALANCE
} from '../utils/economics'

export type SeededPlaceOrderProps = Omit<PlaceOrderProviderProps, 'children'>

export type SeedParams = {
  coin?: string
  side?: string
  price?: string
  entry?: string
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
  const entryPrice =
    toPositive(params.entry) ?? toPositive(params.price) ?? DEFAULT_ENTRY_PRICE
  const maxLeverage = Math.max(
    1,
    toNumber(params.maxLeverage) ?? DEFAULT_MAX_LEVERAGE
  )
  const rawLeverage = toNumber(params.leverage)
  const initialLeverage =
    rawLeverage !== undefined
      ? Math.min(Math.max(1, rawLeverage), maxLeverage)
      : undefined
  const size = Math.max(0, toNumber(params.size) ?? 0)

  return {
    coin: (params.coin ?? DEFAULT_COIN).toUpperCase(),
    side: (params.side === 'short' ? 'short' : 'long') as OrderSide,
    entryPrice,
    availableBalance: MOCK_AVAILABLE_BALANCE,
    maxLeverage,
    initialLeverage,
    // Collateral implied by the position, so the trigger screen's projected
    // P&L has a size to work with.
    initialAmount:
      initialLeverage !== undefined && initialLeverage > 0
        ? (size * entryPrice) / initialLeverage
        : undefined,
    initialTakeProfitPrice: toPositive(params.tp),
    initialStopLossPrice: toPositive(params.sl)
  }
}

/** Shared by the place-order (open) and manage (edit) modal layouts. */
export const useSeededPlaceOrderProps = (): SeededPlaceOrderProps =>
  resolveSeededPlaceOrderProps(useLocalSearchParams<SeedParams>())
