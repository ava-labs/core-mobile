import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { MarginMode } from '../types'
import { estimateLiquidationPrice } from '../utils/economics'

export type OrderSide = 'long' | 'short'

export type { MarginMode }

interface PlaceOrderState {
  coin: string
  side: OrderSide
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
  side: OrderSide
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
  side,
  entryPrice,
  maxLeverage,
  initialAmount = 0,
  initialLeverage,
  initialTakeProfitPrice,
  initialStopLossPrice,
  children
}: PlaceOrderProviderProps): JSX.Element => {
  const [amount, setAmount] = useState(initialAmount)
  // Seed leverage directly from the always-present `initialLeverage`.
  // `maxLeverage` is sourced from live market data and can lag a beat, so the
  // seed is intentionally NOT clamped against it here (that would desync the
  // one-time `leverage` state from the per-render baseline used by the manage
  // screen); the leverage gauge enforces the market max on user edits.
  const [leverage, setLeverage] = useState(initialLeverage)
  // HL's default for a fresh asset is cross; screens re-seed from the actual
  // per-coin `leverageType` once activeAssetData loads.
  const [marginMode, setMarginMode] = useState<MarginMode>('cross')
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

  const value = useMemo<PlaceOrderState>(
    () => ({
      coin,
      side,
      entryPrice,
      maxLeverage,
      amount,
      setAmount,
      leverage,
      setLeverage,
      marginMode,
      setMarginMode,
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
      entryPrice,
      maxLeverage,
      amount,
      leverage,
      marginMode,
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
