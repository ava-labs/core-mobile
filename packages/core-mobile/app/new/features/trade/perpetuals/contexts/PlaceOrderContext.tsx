import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from 'react'

export type OrderSide = 'long' | 'short'

interface PlaceOrderState {
  coin: string
  side: OrderSide
  entryPrice: number
  availableBalance: number
  maxLeverage: number

  amount: number
  setAmount: (value: number) => void

  leverage: number
  setLeverage: (value: number) => void

  takeProfitEnabled: boolean
  setTakeProfitEnabled: (value: boolean) => void
  takeProfitPrice: number | undefined
  setTakeProfitPrice: (value: number | undefined) => void

  stopLossEnabled: boolean
  setStopLossEnabled: (value: boolean) => void
  stopLossPrice: number | undefined
  setStopLossPrice: (value: number | undefined) => void

  liquidationPrice: number
}

const PlaceOrderContext = createContext<PlaceOrderState | undefined>(undefined)

export interface PlaceOrderProviderProps {
  coin: string
  side: OrderSide
  entryPrice: number
  availableBalance: number
  maxLeverage: number
  /** Seed values for editing an existing position (Manage flow). */
  initialAmount?: number
  initialLeverage?: number
  initialTakeProfitPrice?: number
  initialStopLossPrice?: number
  children: ReactNode
}

// Isolated-margin liquidation approximation. Good enough for the UI-only
// summary; the SDK will provide the authoritative value once wired.
const estimateLiquidationPrice = (
  entryPrice: number,
  side: OrderSide,
  leverage: number
): number => {
  if (leverage <= 0) return entryPrice
  const delta = entryPrice / leverage
  return side === 'long' ? entryPrice - delta : entryPrice + delta
}

export const PlaceOrderProvider = ({
  coin,
  side,
  entryPrice,
  availableBalance,
  maxLeverage,
  initialAmount = 0,
  initialLeverage = 2,
  initialTakeProfitPrice,
  initialStopLossPrice,
  children
}: PlaceOrderProviderProps): JSX.Element => {
  const [amount, setAmount] = useState(initialAmount)
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

  const value = useMemo<PlaceOrderState>(
    () => ({
      coin,
      side,
      entryPrice,
      availableBalance,
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
      liquidationPrice: estimateLiquidationPrice(entryPrice, side, leverage)
    }),
    [
      coin,
      side,
      entryPrice,
      availableBalance,
      maxLeverage,
      amount,
      leverage,
      takeProfitEnabled,
      takeProfitPrice,
      stopLossEnabled,
      stopLossPrice
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
