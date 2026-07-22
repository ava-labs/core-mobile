import React from 'react'
import renderer, { act } from 'react-test-renderer'
import {
  PlaceOrderProvider,
  usePlaceOrder,
  type OrderSide
} from './PlaceOrderContext'

// Captures the live context value on every render so assertions read the
// latest state without a UI layer.
let ctx!: ReturnType<typeof usePlaceOrder>
const Probe = (): null => {
  ctx = usePlaceOrder()
  return null
}

const renderProvider = (props?: {
  side?: OrderSide
  initialTakeProfitPrice?: number
  initialStopLossPrice?: number
}): renderer.ReactTestRenderer => {
  let instance!: renderer.ReactTestRenderer
  act(() => {
    instance = renderer.create(
      <PlaceOrderProvider
        coin="BTC"
        side={props?.side ?? 'long'}
        entryPrice={100}
        maxLeverage={40}
        initialLeverage={5}
        initialTakeProfitPrice={props?.initialTakeProfitPrice}
        initialStopLossPrice={props?.initialStopLossPrice}>
        <Probe />
      </PlaceOrderProvider>
    )
  })
  return instance
}

describe('PlaceOrderContext switchSide', () => {
  it('flips the side and clears TP/SL prices and toggles', () => {
    renderProvider({
      side: 'long',
      initialTakeProfitPrice: 120,
      initialStopLossPrice: 90
    })
    expect(ctx.side).toBe('long')
    expect(ctx.takeProfitEnabled).toBe(true)
    expect(ctx.stopLossEnabled).toBe(true)

    act(() => {
      ctx.switchSide('short')
    })

    expect(ctx.side).toBe('short')
    expect(ctx.takeProfitEnabled).toBe(false)
    expect(ctx.takeProfitPrice).toBeUndefined()
    expect(ctx.stopLossEnabled).toBe(false)
    expect(ctx.stopLossPrice).toBeUndefined()
  })

  it('is a no-op (keeps TP/SL) when switching to the current side', () => {
    renderProvider({
      side: 'long',
      initialTakeProfitPrice: 120,
      initialStopLossPrice: 90
    })

    act(() => {
      ctx.switchSide('long')
    })

    expect(ctx.side).toBe('long')
    expect(ctx.takeProfitEnabled).toBe(true)
    expect(ctx.takeProfitPrice).toBe(120)
    expect(ctx.stopLossEnabled).toBe(true)
    expect(ctx.stopLossPrice).toBe(90)
  })

  it('recomputes the liquidation price for the new side', () => {
    renderProvider({ side: 'long' })
    const longLiquidation = ctx.liquidationPrice

    act(() => {
      ctx.switchSide('short')
    })

    // Long liquidation sits below entry, short above — they must differ.
    expect(ctx.liquidationPrice).not.toBe(longLiquidation)
  })
})
