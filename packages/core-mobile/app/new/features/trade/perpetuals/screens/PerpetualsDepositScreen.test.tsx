import { TokenUnit } from '@avalabs/core-utils-sdk'
import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Captures the props the screen passes to the widget and the amount strings
// fed to usePerpsDeposit, so we can assert the fixed-dollar presets override
// is gone and amounts are never display-rounded (CP-14874: 25%/50%/Max).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockWidgetProps: { current: any } = { current: undefined }
const mockDepositArgs: string[] = []

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
  usePerpsDeposit: (amountString: string) => {
    mockDepositArgs.push(amountString)
    return {
      bestQuote: undefined,
      isQuoting: false,
      canDeposit: false,
      isDepositing: false,
      executeDeposit: jest.fn()
    }
  }
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
  beforeEach(() => {
    mockWidgetProps.current = undefined
    mockDepositArgs.length = 0
  })

  it('does not override the widget default 25%/50%/Max percentage presets', async () => {
    await act(async () => {
      renderer.create(<PerpetualsDepositScreen />)
    })
    // No `presets` prop → TokenUnitInputWidget falls back to its built-in
    // 25% / 50% / Max buttons computed from `balance`.
    expect(mockWidgetProps.current.presets).toBeUndefined()
    expect(mockWidgetProps.current.balance).toBeDefined()
  })

  it('keeps the full-precision Max amount instead of display-rounding it up', async () => {
    await act(async () => {
      renderer.create(<PerpetualsDepositScreen />)
    })
    // Max on a 28.114275 balance emits the exact balance; the old
    // toDisplay({asNumber: true}) path rounded it up to 28.1143 which the
    // screen then rejected as exceeding the balance.
    await act(async () => {
      mockWidgetProps.current.onChange(new TokenUnit(28114275n, 6, 'USDC'))
    })
    expect(mockDepositArgs[mockDepositArgs.length - 1]).toBe('28.114275')
  })

  it('floors fractional-subunit percentage amounts to USDC precision', async () => {
    await act(async () => {
      renderer.create(<PerpetualsDepositScreen />)
    })
    // 25% of 28.114275 = 7.02856875 — carries fractional subunits that
    // parseUnits(…, 6) in the deposit hook would reject.
    await act(async () => {
      mockWidgetProps.current.onChange(
        new TokenUnit(28114275n, 6, 'USDC').mul(0.25)
      )
    })
    expect(mockDepositArgs[mockDepositArgs.length - 1]).toBe('7.028568')
  })
})
