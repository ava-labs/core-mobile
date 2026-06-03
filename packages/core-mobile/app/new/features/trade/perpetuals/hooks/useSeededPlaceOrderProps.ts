import { useLocalSearchParams } from 'expo-router'
import {
  type OrderSide,
  type PlaceOrderProviderProps
} from '../contexts/PlaceOrderContext'

const DEFAULT_COIN = 'NVDA'
const DEFAULT_ENTRY_PRICE = 62.78
const DEFAULT_MAX_LEVERAGE = 40
// Mock collateral until the SDK's clearinghouseState is wired.
const MOCK_AVAILABLE_BALANCE = 150

const toNumber = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

const toPositive = (value: string | undefined): number | undefined => {
  const n = toNumber(value)
  return n !== undefined && n > 0 ? n : undefined
}

export type SeededPlaceOrderProps = Omit<PlaceOrderProviderProps, 'children'>

/**
 * Builds `PlaceOrderProvider` props from route params. Shared by the
 * place-order (open) and manage (edit) modal layouts:
 *  - open passes `price` + optional `maxLeverage`
 *  - manage passes `entry`, `leverage`, `size` and existing `tp` / `sl`
 * Absent params fall back so each flow only sets what it needs.
 */
export const useSeededPlaceOrderProps = (): SeededPlaceOrderProps => {
  const params = useLocalSearchParams<{
    coin?: string
    side?: string
    price?: string
    entry?: string
    maxLeverage?: string
    leverage?: string
    size?: string
    tp?: string
    sl?: string
  }>()

  // Sanitize: a malformed deep link must never produce a non-positive price,
  // out-of-range leverage, or negative collateral.
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
