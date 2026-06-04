import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useMemo } from 'react'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'

export interface TriggerToggleState {
  enabled: boolean
  onToggle: (next: boolean) => void
  /** Formatted price for the drill-in row, or undefined when unset. */
  drillValue: string | undefined
}

/**
 * The take-profit / stop-loss toggle behaviour shared by the place-order and
 * manage screens: flipping the switch enables the trigger (and clears its
 * price when turned off), and the drill-in row shows the set price. The
 * `onPressDrill` navigation stays in each screen since the trigger route
 * differs per flow.
 */
export const useTriggerToggles = (): {
  takeProfit: TriggerToggleState
  stopLoss: TriggerToggleState
} => {
  const { formatCurrency } = useFormatCurrency()
  const {
    takeProfitEnabled,
    setTakeProfitEnabled,
    takeProfitPrice,
    setTakeProfitPrice,
    stopLossEnabled,
    setStopLossEnabled,
    stopLossPrice,
    setStopLossPrice
  } = usePlaceOrder()

  const takeProfit = useMemo<TriggerToggleState>(
    () => ({
      enabled: takeProfitEnabled,
      onToggle: next => {
        setTakeProfitEnabled(next)
        if (!next) setTakeProfitPrice(undefined)
      },
      drillValue:
        takeProfitPrice !== undefined
          ? formatCurrency({ amount: takeProfitPrice })
          : undefined
    }),
    [
      takeProfitEnabled,
      takeProfitPrice,
      setTakeProfitEnabled,
      setTakeProfitPrice,
      formatCurrency
    ]
  )

  const stopLoss = useMemo<TriggerToggleState>(
    () => ({
      enabled: stopLossEnabled,
      onToggle: next => {
        setStopLossEnabled(next)
        if (!next) setStopLossPrice(undefined)
      },
      drillValue:
        stopLossPrice !== undefined
          ? formatCurrency({ amount: stopLossPrice })
          : undefined
    }),
    [
      stopLossEnabled,
      stopLossPrice,
      setStopLossEnabled,
      setStopLossPrice,
      formatCurrency
    ]
  )

  return { takeProfit, stopLoss }
}
