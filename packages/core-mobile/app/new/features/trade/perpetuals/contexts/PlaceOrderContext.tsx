import type { PerpUniverseEntry } from '@avalabs/perps-sdk'
import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import type { MarginMode } from '../types'
import { estimateLiquidationPrice } from '../utils/economics'

export type OrderSide = 'long' | 'short'

export type { MarginMode }

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

  /**
   * Cross vs isolated margin for the coin. On Hyperliquid this is the
   * `isCross` flag of the per-coin leverage setting, not an order parameter.
   * Seeded from HL's `leverageType` by the consuming screens.
   */
  marginMode: MarginMode
  setMarginMode: (value: MarginMode) => void

  /**
   * Per-coin market metadata (max leverage, `onlyIsolated`, size precision),
   * from the layout's single market-context subscription. Shared here so the
   * sheets in the stack don't each open their own WebSocket for the same coin.
   * `undefined` until the market data loads.
   */
  universe: PerpUniverseEntry | undefined

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
  /** Live per-coin market metadata; `undefined` until loaded. */
  universe?: PerpUniverseEntry
  /**
   * Hyperliquid's authoritative margin mode for the coin (`onlyIsolated`
   * already applied); `undefined` until known. Seeds `marginMode` here in the
   * provider — the always-mounted layout — so the value is correct before any
   * sheet's Done can commit, regardless of which screens are mounted.
   */
  hlMarginMode?: MarginMode
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
  universe,
  hlMarginMode,
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
  // HL's default for a fresh asset is cross; re-seeded from the actual
  // per-coin mode below once it loads.
  const [marginMode, setMarginMode] = useState<MarginMode>('cross')

  // Seed once from HL's per-coin mode. A layout effect (not useEffect) so the
  // context is updated before paint in the same commit that enables the
  // sheets' Done buttons (they gate on the same leverageType/universe data) —
  // a passive effect would leave one interactive frame where a commit could
  // send the unseeded 'cross' default. Seed-once so a later refetch (e.g.
  // after the margin sheet commits a change) can't overwrite user intent.
  const seededMarginModeRef = useRef(false)
  useLayoutEffect(() => {
    if (seededMarginModeRef.current || hlMarginMode === undefined) {
      return
    }
    seededMarginModeRef.current = true
    setMarginMode(hlMarginMode)
  }, [hlMarginMode])
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
      marginMode,
      setMarginMode,
      universe,
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
      marginMode,
      universe,
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
