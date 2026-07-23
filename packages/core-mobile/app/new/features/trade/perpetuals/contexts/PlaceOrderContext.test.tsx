import React from 'react'
import renderer, { act } from 'react-test-renderer'
import {
  PlaceOrderProvider,
  usePlaceOrder,
  type MarginMode,
  type OrderSide
} from './PlaceOrderContext'

// Captures the live context value on every render so assertions read the
// latest state without a UI layer.
let ctx!: ReturnType<typeof usePlaceOrder>
const Probe = (): null => {
  ctx = usePlaceOrder()
  return null
}

interface RenderProps {
  initialSide?: OrderSide
  initialTakeProfitPrice?: number
  initialStopLossPrice?: number
  hlMarginMode?: MarginMode
}

const providerElement = (props?: RenderProps): JSX.Element => (
  <PlaceOrderProvider
    coin="BTC"
    initialSide={props?.initialSide ?? 'long'}
    entryPrice={100}
    maxLeverage={40}
    initialLeverage={5}
    initialTakeProfitPrice={props?.initialTakeProfitPrice}
    initialStopLossPrice={props?.initialStopLossPrice}
    hlMarginMode={props?.hlMarginMode}>
    <Probe />
  </PlaceOrderProvider>
)

const renderProvider = (props?: RenderProps): renderer.ReactTestRenderer => {
  let instance!: renderer.ReactTestRenderer
  act(() => {
    instance = renderer.create(providerElement(props))
  })
  return instance
}

const rerenderProvider = (
  instance: renderer.ReactTestRenderer,
  props?: RenderProps
): void => {
  act(() => {
    instance.update(providerElement(props))
  })
}

describe('PlaceOrderContext switchSide', () => {
  it('flips the side and clears TP/SL prices and toggles', () => {
    renderProvider({
      initialSide: 'long',
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
      initialSide: 'long',
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
    renderProvider({ initialSide: 'long' })
    const longLiquidation = ctx.liquidationPrice

    act(() => {
      ctx.switchSide('short')
    })

    // Long liquidation sits below entry, short above — they must differ.
    expect(ctx.liquidationPrice).not.toBe(longLiquidation)
  })
})

describe('PlaceOrderProvider marginMode seeding', () => {
  it("defaults to 'cross' while HL's mode is unknown", () => {
    renderProvider()
    expect(ctx.marginMode).toBe('cross')
  })

  it('seeds from hlMarginMode as soon as it resolves', () => {
    const instance = renderProvider()
    rerenderProvider(instance, { hlMarginMode: 'isolated' })
    expect(ctx.marginMode).toBe('isolated')
  })

  it('seeds only once — a later hlMarginMode change does not re-seed', () => {
    // After a user commits a mode change, the query refetches and hlMarginMode
    // can transiently report a different value; that must not clobber state
    // the user (or the margin sheet) has since set.
    const instance = renderProvider()
    rerenderProvider(instance, { hlMarginMode: 'cross' })
    expect(ctx.marginMode).toBe('cross')
    rerenderProvider(instance, { hlMarginMode: 'isolated' })
    expect(ctx.marginMode).toBe('cross')
  })
})
