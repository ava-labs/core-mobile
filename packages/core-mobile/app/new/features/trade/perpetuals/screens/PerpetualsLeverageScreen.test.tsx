import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack })
}))

const mockSetLeverage = jest.fn()
const mockCtx = { marginMode: 'isolated' as 'cross' | 'isolated' }
jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => ({
    coin: 'BTC',
    side: 'long',
    entryPrice: 100,
    maxLeverage: 40,
    leverage: 2,
    setLeverage: mockSetLeverage,
    marginMode: mockCtx.marginMode
  })
}))

const mockUpdateLeverage = jest.fn()
jest.mock('../hooks/usePerpsPositionActions', () => ({
  usePerpsPositionActions: () => ({
    updateLeverage: mockUpdateLeverage,
    busy: false
  })
}))

jest.mock('../hooks/usePerpsActiveAssetData', () => ({
  usePerpsActiveAssetData: () => ({
    leverage: 2,
    leverageType: mockCtx.marginMode,
    maxBuySizeCoin: undefined,
    maxSellSizeCoin: undefined,
    isLoading: false,
    refetch: jest.fn().mockResolvedValue(3)
  })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))

jest.mock('common/components/ScrollScreen', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollScreen: ({ children, renderFooter }: any) =>
      r.createElement(
        rn.View,
        null,
        children,
        renderFooter ? renderFooter() : null
      )
  }
})

jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  const pass =
    (C: React.ElementType) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _v, ...rest }: any) =>
      r.createElement(C, rest, children)
  return {
    View: pass(rn.View),
    Text: pass(rn.Text),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, ...rest }: any) =>
      r.createElement(rn.View, rest, children),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LeverageGauge: (props: any) => r.createElement(rn.View, props)
  }
})

import { PerpetualsLeverageScreen } from './PerpetualsLeverageScreen'

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsLeverageScreen />)
  })
  return instance
}

describe('PerpetualsLeverageScreen margin mode', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockUpdateLeverage.mockReset()
    mockSetLeverage.mockReset()
  })

  it('commits leverage with the isCross flag from the current margin mode', async () => {
    mockCtx.marginMode = 'isolated'
    mockUpdateLeverage.mockResolvedValueOnce(true)
    const instance = await render()

    const gauge = instance.root.findByProps({ min: 1 })
    await act(async () => {
      gauge.props.onChange(5)
    })
    const done = instance.root.findByProps({
      testID: 'perpetuals_leverage_done'
    })
    await act(async () => {
      await done.props.onPress()
    })

    expect(mockUpdateLeverage).toHaveBeenCalledWith('BTC', 5, false)
    expect(mockBack).toHaveBeenCalled()
  })

  it('keeps isCross=true for cross-margin users', async () => {
    mockCtx.marginMode = 'cross'
    mockUpdateLeverage.mockResolvedValueOnce(true)
    const instance = await render()

    const gauge = instance.root.findByProps({ min: 1 })
    await act(async () => {
      gauge.props.onChange(5)
    })
    const done = instance.root.findByProps({
      testID: 'perpetuals_leverage_done'
    })
    await act(async () => {
      await done.props.onPress()
    })

    expect(mockUpdateLeverage).toHaveBeenCalledWith('BTC', 5, true)
  })
})
