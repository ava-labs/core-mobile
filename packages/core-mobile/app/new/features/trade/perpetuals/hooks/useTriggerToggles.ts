import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useMemo } from 'react'
import { usePlaceOrder } from '../contexts/PlaceOrderContext'

export interface TriggerToggleState {
  enabled: boolean
  onToggle: (next: boolean) => void
  /** Formatted price for the drill-in row, or undefined when unset. */
  drillValue: string | undefined
}

interface TriggerOpenHandlers {
  /** Opens the take-profit trigger screen (route differs per flow). */
  openTakeProfit: () => void
  openStopLoss: () => void
}

/**
 * The take-profit / stop-loss toggle behaviour shared by the place-order and
 * manage screens: flipping the switch on enables the trigger AND opens its
 * price screen; flipping it off clears the price. The drill-in row shows the
 * set price. The open navigation is injected since the trigger route differs
 * per flow.
 */
export const useTriggerToggles = ({
  openTakeProfit,
  openStopLoss
}: TriggerOpenHandlers): {
  takeProfit: TriggerToggleState
  stopLoss: TriggerToggleState
} => {
  const { formatCurrency } = useFormatCurrency()
  const {
    takeProfitEnabled,
    setTakeProfitEnabled,
    takeProfitPrice,
    stopLossEnabled,
    setStopLossEnabled,
    stopLossPrice
  } = usePlaceOrder()

  // Toggling on opens the price screen when no price is set yet (enabled only
  // flips on once a price is confirmed, so backing out leaves it off); if a
  // price already exists it just re-enables. Toggling off keeps the price so
  // it's restored on re-enable.
  const takeProfit = useMemo<TriggerToggleState>(
    () => ({
      enabled: takeProfitEnabled,
      onToggle: next => {
        if (!next) {
          setTakeProfitEnabled(false)
        } else if (takeProfitPrice !== undefined) {
          setTakeProfitEnabled(true)
        } else {
          openTakeProfit()
        }
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
      openTakeProfit,
      formatCurrency
    ]
  )

  const stopLoss = useMemo<TriggerToggleState>(
    () => ({
      enabled: stopLossEnabled,
      onToggle: next => {
        if (!next) {
          setStopLossEnabled(false)
        } else if (stopLossPrice !== undefined) {
          setStopLossEnabled(true)
        } else {
          openStopLoss()
        }
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
      openStopLoss,
      formatCurrency
    ]
  )

  return { takeProfit, stopLoss }
}
