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

  const entryPrice =
    toNumber(params.entry) ?? toNumber(params.price) ?? DEFAULT_ENTRY_PRICE
  const leverage = toNumber(params.leverage)
  const size = toNumber(params.size) ?? 0

  return {
    coin: (params.coin ?? DEFAULT_COIN).toUpperCase(),
    side: (params.side === 'short' ? 'short' : 'long') as OrderSide,
    entryPrice,
    availableBalance: MOCK_AVAILABLE_BALANCE,
    maxLeverage: toNumber(params.maxLeverage) ?? DEFAULT_MAX_LEVERAGE,
    initialLeverage: leverage,
    // Collateral implied by the position, so the trigger screen's projected
    // P&L has a size to work with.
    initialAmount:
      leverage !== undefined && leverage > 0
        ? (size * entryPrice) / leverage
        : undefined,
    initialTakeProfitPrice: toPositive(params.tp),
    initialStopLossPrice: toPositive(params.sl)
  }
}
