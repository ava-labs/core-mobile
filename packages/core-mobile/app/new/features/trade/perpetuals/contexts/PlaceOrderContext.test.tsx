import React from 'react'
import { Text } from 'react-native'
import renderer, { act } from 'react-test-renderer'
import {
  PlaceOrderProvider,
  usePlaceOrder,
  type MarginMode,
  type PlaceOrderProviderProps
} from './PlaceOrderContext'

const ModeProbe = (): JSX.Element => {
  const { marginMode } = usePlaceOrder()
  return <Text testID="mode">{marginMode}</Text>
}

const baseProps: Omit<PlaceOrderProviderProps, 'children'> = {
  coin: 'BTC',
  side: 'long',
  entryPrice: 100,
  maxLeverage: 40,
  initialLeverage: 2
}

const renderProvider = async (
  hlMarginMode: MarginMode | undefined
): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <PlaceOrderProvider {...baseProps} hlMarginMode={hlMarginMode}>
        <ModeProbe />
      </PlaceOrderProvider>
    )
  })
  return instance
}

const rerenderProvider = async (
  instance: renderer.ReactTestRenderer,
  hlMarginMode: MarginMode | undefined
): Promise<void> => {
  await act(async () => {
    instance.update(
      <PlaceOrderProvider {...baseProps} hlMarginMode={hlMarginMode}>
        <ModeProbe />
      </PlaceOrderProvider>
    )
  })
}

const mode = (instance: renderer.ReactTestRenderer): string =>
  instance.root.findByProps({ testID: 'mode' }).props.children

describe('PlaceOrderProvider marginMode seeding', () => {
  it("defaults to 'cross' while HL's mode is unknown", async () => {
    const instance = await renderProvider(undefined)
    expect(mode(instance)).toBe('cross')
  })

  it('seeds from hlMarginMode as soon as it resolves', async () => {
    const instance = await renderProvider(undefined)
    await rerenderProvider(instance, 'isolated')
    expect(mode(instance)).toBe('isolated')
  })

  it('seeds only once — a later hlMarginMode change does not re-seed', async () => {
    // After a user commits a mode change, the query refetches and hlMarginMode
    // can transiently report a different value; that must not clobber state
    // the user (or the margin sheet) has since set.
    const instance = await renderProvider(undefined)
    await rerenderProvider(instance, 'cross')
    expect(mode(instance)).toBe('cross')
    await rerenderProvider(instance, 'isolated')
    expect(mode(instance)).toBe('cross')
  })
})
