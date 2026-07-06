import React from 'react'
import renderer, { act } from 'react-test-renderer'

const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, navigate: jest.fn() })
}))

const mockState = { isGeoBlocked: false }
const mockRecheck = jest.fn()
jest.mock('../hooks/usePerpsAvailability', () => ({
  usePerpsAvailability: () => ({
    isGeoBlocked: mockState.isGeoBlocked,
    isLoading: false,
    recheckGeoBlock: mockRecheck
  })
}))

const mockShowSnackbar = jest.fn()
jest.mock('common/utils/toast', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showSnackbar: (...args: any[]) => mockShowSnackbar(...args)
}))

jest.mock('../contexts/PlaceOrderContext', () => ({
  usePlaceOrder: () => ({
    coin: 'BTC',
    side: 'long',
    entryPrice: 1,
    availableBalance: 100,
    amount: 10,
    setAmount: jest.fn(),
    leverage: 2,
    liquidationPrice: 1
  })
}))

jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))

jest.mock('../hooks/useTriggerToggles', () => ({
  useTriggerToggles: () => ({
    takeProfit: { enabled: false, onToggle: jest.fn(), drillValue: '' },
    stopLoss: { enabled: false, onToggle: jest.fn(), drillValue: '' }
  })
}))

jest.mock('../components/PositionPill', () => ({ PositionPill: () => null }))
jest.mock('../components/TriggerToggleCard', () => ({
  TriggerToggleCard: () => null
}))
jest.mock('../../../../assets/icons/hyperliquid-logo.svg', () => () => null)

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alpha: (c: any) => c,
    View: pass(rn.View),
    Text: pass(rn.Text),
    GroupList: () => null,
    CircularDial: () => null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SlidingButton: (props: any) => r.createElement(rn.View, props),
    useTheme: () => ({ theme: { colors: { $textPrimary: '#fff' } } })
  }
})

import { PerpetualsPlaceOrderScreen } from './PerpetualsPlaceOrderScreen'

const CONFIRM = 'perpetuals_place_order_confirm'

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsPlaceOrderScreen />)
  })
  return instance
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const confirmButton = (instance: renderer.ReactTestRenderer): any =>
  instance.root.findAllByProps({ testID: CONFIRM })[0]

describe('PerpetualsPlaceOrderScreen geo-restriction', () => {
  beforeEach(() => {
    mockBack.mockReset()
    mockRecheck.mockReset()
    mockShowSnackbar.mockReset()
    mockState.isGeoBlocked = false
  })

  it('disables the confirm button when geo-blocked', async () => {
    mockState.isGeoBlocked = true
    const instance = await render()
    expect(confirmButton(instance).props.disabled).toBe(true)
  })

  it('aborts the order and warns when the fresh geo re-check is blocked', async () => {
    mockRecheck.mockResolvedValueOnce(true)
    const instance = await render()
    await act(async () => {
      await confirmButton(instance).props.onConfirm()
    })
    expect(mockShowSnackbar).toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('fails closed — aborts the order and warns when the geo re-check itself fails', async () => {
    mockRecheck.mockRejectedValueOnce(new Error('re-check failed'))
    const instance = await render()
    await act(async () => {
      await confirmButton(instance).props.onConfirm()
    })
    expect(mockShowSnackbar).toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()
  })

  it('does not warn when the fresh geo re-check passes', async () => {
    // Fake timers so the simulated 1200ms submission delay doesn't slow the suite.
    jest.useFakeTimers()
    try {
      mockRecheck.mockResolvedValueOnce(false)
      const instance = await render()
      await act(async () => {
        const submission = confirmButton(instance).props.onConfirm()
        await jest.advanceTimersByTimeAsync(1200)
        await submission
      })
      expect(mockRecheck).toHaveBeenCalled()
      expect(mockShowSnackbar).not.toHaveBeenCalled()
      expect(mockBack).toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })
})
