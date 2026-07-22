import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Captures the props the screen passes to the widget so we can assert the
// fixed-dollar presets override is gone (CP-14874: default 25%/50%/Max).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockWidgetProps: { current: any } = { current: undefined }

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() })
}))

jest.mock('common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

jest.mock('../hooks/useCChainUsdc', () => ({
  useCChainUsdc: () => ({ formattedBalance: '28.1142' })
}))

jest.mock('../hooks/usePerpsDeposit', () => ({
  usePerpsDeposit: () => ({
    bestQuote: undefined,
    isQuoting: false,
    canDeposit: false,
    isDepositing: false,
    executeDeposit: jest.fn()
  })
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
    Button: () => null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TokenUnitInputWidget: (props: any) => {
      mockWidgetProps.current = props
      return null
    }
  }
})

import { PerpetualsDepositScreen } from './PerpetualsDepositScreen'

describe('PerpetualsDepositScreen quick-amount presets', () => {
  it('does not override the widget default 25%/50%/Max percentage presets', async () => {
    await act(async () => {
      renderer.create(<PerpetualsDepositScreen />)
    })
    // No `presets` prop → TokenUnitInputWidget falls back to its built-in
    // 25% / 50% / Max buttons computed from `balance`.
    expect(mockWidgetProps.current.presets).toBeUndefined()
    expect(mockWidgetProps.current.balance).toBeDefined()
  })
})
