import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, navigate: jest.fn() }),
  useLocalSearchParams: () => ({ kind: 'takeProfit' })
}))

const mockSetTakeProfitPrice = jest.fn()
const mockSetTakeProfitEnabled = jest.fn()
const mockSetStopLossPrice = jest.fn()
const mockSetStopLossEnabled = jest.fn()
const mockPlaceOrder = {
  coin: 'BTC',
  side: 'long' as 'long' | 'short',
  entryPrice: 100,
  amount: 10,
  takeProfitPrice: undefined as number | undefined,
  setTakeProfitPrice: mockSetTakeProfitPrice,
  setTakeProfitEnabled: mockSetTakeProfitEnabled,
  stopLossPrice: undefined as number | undefined,
  setStopLossPrice: mockSetStopLossPrice,
  setStopLossEnabled: mockSetStopLossEnabled,
  limitPriceEnabled: false,
  limitPrice: undefined as number | undefined
}
jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => mockPlaceOrder
}))

jest.mock('../hooks/useHyperliquidMarketContext', () => ({
  useHyperliquidMarketContext: () => ({ assetCtx: { markPx: '100' } })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({
    formatCurrency: ({ amount }: { amount: number }) => `$${amount}`
  })
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
    FiatAmountInput: ({ onChange, amount, ...rest }: any) =>
      r.createElement(rn.TextInput, {
        ...rest,
        value: amount,
        onChangeText: onChange,
        testID: 'perpetuals_trigger_price_input'
      }),
    // Stashes the `data` prop (title/value pairs) on a Text so the test can
    // read the rendered projected P&L without needing GroupList's real body.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GroupList: ({ data }: any) =>
      r.createElement(
        rn.Text,
        { testID: 'perpetuals_trigger_pnl' },
        data?.[0]?.value
      ),
    useTheme: () => ({
      theme: {
        colors: {
          $textPrimary: '#fff',
          $textSecondary: '#999',
          $textSuccess: '#0f0',
          $textDanger: '#f00'
        }
      }
    })
  }
})

import { PerpetualsTriggerScreen } from './PerpetualsTriggerScreen'

const renderScreen = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsTriggerScreen />)
  })
  return instance
}

describe('PerpetualsTriggerScreen', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockSetTakeProfitPrice.mockReset()
    mockSetTakeProfitEnabled.mockReset()
    mockSetStopLossPrice.mockReset()
    mockSetStopLossEnabled.mockReset()
    mockPlaceOrder.side = 'long'
    mockPlaceOrder.entryPrice = 100
    mockPlaceOrder.amount = 10
    mockPlaceOrder.takeProfitPrice = undefined
    mockPlaceOrder.stopLossPrice = undefined
    mockPlaceOrder.limitPriceEnabled = false
    mockPlaceOrder.limitPrice = undefined
  })

  it('projects P&L from the seeded entry price when no limit price is set', async () => {
    const instance = await renderScreen()
    const input = instance.root.findByProps({
      testID: 'perpetuals_trigger_price_input'
    })
    await act(async () => {
      input.props.onChangeText('210')
    })
    const pnl = instance.root.findByProps({
      testID: 'perpetuals_trigger_pnl'
    })
    // sizeTokens = 10 / 100 = 0.1; pnl = (210 - 100) * 0.1 = 11
    expect(pnl.props.children).toBe('$11')
  })

  it('projects P&L from the limit price when a limit entry is enabled', async () => {
    mockPlaceOrder.limitPriceEnabled = true
    mockPlaceOrder.limitPrice = 200
    const instance = await renderScreen()
    const input = instance.root.findByProps({
      testID: 'perpetuals_trigger_price_input'
    })
    await act(async () => {
      input.props.onChangeText('210')
    })
    const pnl = instance.root.findByProps({
      testID: 'perpetuals_trigger_pnl'
    })
    // sizeTokens = 10 / 200 = 0.05; pnl = (210 - 200) * 0.05 = 0.5
    expect(pnl.props.children).toBe('$0.5')
  })
})
