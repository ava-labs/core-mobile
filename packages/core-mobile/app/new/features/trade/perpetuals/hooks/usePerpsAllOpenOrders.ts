import { type InfoOrderStatusWire, type OpenOrder } from '@avalabs/perps-sdk'
import { useMemo } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import { useHip3OpenOrders } from './useHip3OpenOrders'
import { usePerpsOpenOrders } from './usePerpsOpenOrders'

export type PerpsAllOpenOrders = {
  /**
   * Main-dex (rich `frontendOpenOrders`) + HIP-3 (minimal `openOrders`) open
   * orders, merged for display. Builder-dex rows lack trigger / TP-SL metadata,
   * so consumers should treat the extra fields as optional.
   */
  readonly orders: readonly (InfoOrderStatusWire | OpenOrder)[]
  readonly isLoading: boolean
}

/**
 * The active account's complete open-orders view: main-dex resting orders (with
 * full trigger / TP-SL metadata) merged with every HIP-3 (builder-dex) order.
 * Both are seeded over REST and kept live over the `openOrders` WebSocket
 * channel (see {@link usePerpsOpenOrders} and {@link useHip3OpenOrders}).
 */
export const usePerpsAllOpenOrders = (): PerpsAllOpenOrders => {
  const { userAddress } = usePerps()
  const { orders: mainOrders, isLoading: mainLoading } =
    usePerpsOpenOrders(userAddress)
  const hip3 = useHip3OpenOrders(userAddress)

  const orders = useMemo(
    () => [...mainOrders, ...hip3.orders],
    [mainOrders, hip3.orders]
  )

  return { orders, isLoading: mainLoading || hip3.isLoading }
}
