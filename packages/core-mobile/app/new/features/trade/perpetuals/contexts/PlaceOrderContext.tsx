import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { estimateLiquidationPrice } from '../utils/economics'

export type OrderSide = 'long' | 'short'

interface PlaceOrderState {
  coin: string
  side: OrderSide
  /**
   * Flip the order direction in place (open flow only). Clears TP/SL prices
   * and toggles because trigger prices are direction-specific — a long's TP
   * sits on the wrong side of the price for a short. No-op if unchanged.
   */
  switchSide: (side: OrderSide) => void
  entryPrice: number
  maxLeverage: number

  /** Position notional in USD (not collateral or account balance). */
  amount: number
  setAmount: (value: number) => void

  leverage: number
  setLeverage: (value: number) => void

  // `enabled` is only ever set true once a price exists (see useTriggerToggles
  // + the trigger screen's Done), so there's no dangling enabled-but-unset
  // state. Disabling keeps the price so re-enabling restores it.
  takeProfitEnabled: boolean
  setTakeProfitEnabled: (value: boolean) => void
  takeProfitPrice: number | undefined
  setTakeProfitPrice: (value: number | undefined) => void

  stopLossEnabled: boolean
  setStopLossEnabled: (value: boolean) => void
  stopLossPrice: number | undefined
  setStopLossPrice: (value: number | undefined) => void

  liquidationPrice: number

  // Seeded baseline (effective, after clamping) so the Manage flow can tell
  // whether the user has changed anything before enabling "Update position".
  initialLeverage: number
  initialTakeProfitPrice: number | undefined
  initialStopLossPrice: number | undefined
}

const PlaceOrderContext = createContext<PlaceOrderState | undefined>(undefined)

export interface PlaceOrderProviderProps {
  coin: string
  /**
   * Seed only — sets the initial `PlaceOrderState.side` via `useState`. The
   * place-order screen flips the live side afterwards via `switchSide`, so
   * this prop is not kept in sync with it.
   */
  initialSide: OrderSide
  entryPrice: number
  maxLeverage: number
  /**
   * Starting leverage. Hyperliquid always reports a per-coin leverage (even on
   * first visit), so this is always a real value — the manage flow passes the
   * position's leverage, the open flow the coin's current HL leverage.
   */
  initialLeverage: number
  /** Seed values for editing an existing position (Manage flow). */
  initialAmount?: number
  initialTakeProfitPrice?: number
  initialStopLossPrice?: number
  children: ReactNode
}

export const PlaceOrderProvider = ({
  coin,
  initialSide,
  entryPrice,
  maxLeverage,
  initialAmount = 0,
  initialLeverage,
  initialTakeProfitPrice,
  initialStopLossPrice,
  children
}: PlaceOrderProviderProps): JSX.Element => {
  const [side, setSide] = useState(initialSide)
  const [amount, setAmount] = useState(initialAmount)
  // Seed leverage directly from the always-present `initialLeverage`.
  // `maxLeverage` is sourced from live market data and can lag a beat, so the
  // seed is intentionally NOT clamped against it here (that would desync the
  // one-time `leverage` state from the per-render baseline used by the manage
  // screen); the leverage gauge enforces the market max on user edits.
  const [leverage, setLeverage] = useState(initialLeverage)
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(
    initialTakeProfitPrice !== undefined
  )
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | undefined>(
    initialTakeProfitPrice
  )
  const [stopLossEnabled, setStopLossEnabled] = useState(
    initialStopLossPrice !== undefined
  )
  const [stopLossPrice, setStopLossPrice] = useState<number | undefined>(
    initialStopLossPrice
  )

  const switchSide = useCallback(
    (newSide: OrderSide) => {
      if (newSide === side) {
        return
      }
      setSide(newSide)
      setTakeProfitEnabled(false)
      setTakeProfitPrice(undefined)
      setStopLossEnabled(false)
      setStopLossPrice(undefined)
    },
    [side]
  )

  const value = useMemo<PlaceOrderState>(
    () => ({
      coin,
      side,
      switchSide,
      entryPrice,
      maxLeverage,
      amount,
      setAmount,
      leverage,
      setLeverage,
      takeProfitEnabled,
      setTakeProfitEnabled,
      takeProfitPrice,
      setTakeProfitPrice,
      stopLossEnabled,
      setStopLossEnabled,
      stopLossPrice,
      setStopLossPrice,
      liquidationPrice: estimateLiquidationPrice(
        entryPrice,
        leverage,
        side === 'long',
        maxLeverage
      ),
      initialLeverage,
      initialTakeProfitPrice,
      initialStopLossPrice
    }),
    [
      coin,
      side,
      switchSide,
      entryPrice,
      maxLeverage,
      amount,
      leverage,
      takeProfitEnabled,
      takeProfitPrice,
      stopLossEnabled,
      stopLossPrice,
      initialLeverage,
      initialTakeProfitPrice,
      initialStopLossPrice
    ]
  )

  return (
    <PlaceOrderContext.Provider value={value}>
      {children}
    </PlaceOrderContext.Provider>
  )
}

export const usePlaceOrder = (): PlaceOrderState => {
  const ctx = useContext(PlaceOrderContext)
  if (ctx === undefined) {
    throw new Error('usePlaceOrder must be used within a PlaceOrderProvider')
  }
  return ctx
}
