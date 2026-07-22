import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, navigate: jest.fn() })
}))

const mockSetLimitPrice = jest.fn()
const mockSetLimitPriceEnabled = jest.fn()
const mockPlaceOrder = {
  coin: 'BTC',
  side: 'long',
  entryPrice: 100,
  limitPrice: undefined as number | undefined,
  setLimitPrice: mockSetLimitPrice,
  setLimitPriceEnabled: mockSetLimitPriceEnabled
}
jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => mockPlaceOrder
}))

jest.mock('../hooks/useHyperliquidMarketContext', () => ({
  useHyperliquidMarketContext: () => ({ assetCtx: { markPx: '100' } })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))
jest.mock('common/utils/dismissKeyboardIfNeeded', () => ({
  dismissKeyboardIfNeeded: async () => undefined
}))
jest.mock('../components/PositionPill', () => ({ PositionPill: () => null }))
jest.mock('common/components/ScrollScreen', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollScreen: ({ children, renderFooter }: any) =>
      r.createElement(rn.View, null, children, renderFooter ? renderFooter() : null)
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
    FiatAmountInput: ({ onChange, amount, ...rest }: any) =>
      r.createElement(rn.TextInput, {
        ...rest,
        value: amount,
        onChangeText: onChange,
        testID: 'perpetuals_limit_price_input'
      }),
    useTheme: () => ({
      theme: { colors: { $textPrimary: '#fff', $textSecondary: '#999' } }
    })
  }
})

import { PerpetualsLimitPriceScreen } from './PerpetualsLimitPriceScreen'

const renderScreen = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsLimitPriceScreen />)
  })
  return instance
}

describe('PerpetualsLimitPriceScreen', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockSetLimitPrice.mockReset()
    mockSetLimitPriceEnabled.mockReset()
    mockPlaceOrder.limitPrice = undefined
  })

  it('disables Done until a positive price is entered', async () => {
    const instance = await renderScreen()
    const done = instance.root.findByProps({
      testID: 'perpetuals_limit_price_done'
    })
    expect(done.props.disabled).toBe(true)
  })

  it('commits the price, enables the limit and goes back on Done', async () => {
    const instance = await renderScreen()
    const input = instance.root.findByProps({
      testID: 'perpetuals_limit_price_input'
    })
    await act(async () => {
      input.props.onChangeText('104')
    })
    const done = instance.root.findByProps({
      testID: 'perpetuals_limit_price_done'
    })
    expect(done.props.disabled).toBe(false)
    await act(async () => {
      await done.props.onPress()
    })
    expect(mockSetLimitPrice).toHaveBeenCalledWith(104)
    expect(mockSetLimitPriceEnabled).toHaveBeenCalledWith(true)
    expect(mockBack).toHaveBeenCalled()
  })

  it('seeds the input from an existing limit price', async () => {
    mockPlaceOrder.limitPrice = 55
    const instance = await renderScreen()
    const input = instance.root.findByProps({
      testID: 'perpetuals_limit_price_input'
    })
    expect(input.props.value).toBe('55')
  })
})
