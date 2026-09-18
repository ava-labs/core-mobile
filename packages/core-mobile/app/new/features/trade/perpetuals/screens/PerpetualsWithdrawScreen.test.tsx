import { TokenUnit } from '@avalabs/core-utils-sdk'
import React from 'react'
import renderer, { act } from 'react-test-renderer'

// Captures the props the screen passes to the amount widget and the amount
// strings the screen feeds usePerpsWithdraw, so we can assert the amount is
// never display-rounded (CP-14874: Max must not exceed the withdrawable).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockWidgetProps: { current: any } = { current: undefined }
const mockWithdrawArgs: string[] = []
const mockWithdrawState = {
  withdrawableUsd: 44.148877,
  exceedsWithdrawable: false
}

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() })
}))

jest.mock('common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

jest.mock('features/swap/utils/fusionErrors', () => ({
  isUserRejectionError: () => false
}))

jest.mock('../hooks/usePerpsWithdraw', () => ({
  usePerpsWithdraw: (amountString: string) => {
    mockWithdrawArgs.push(amountString)
    return {
      withdrawableUsd: mockWithdrawState.withdrawableUsd,
      isWithdrawableLoading: false,
      refetchWithdrawable: jest.fn(),
      bestQuote: undefined,
      isQuoting: false,
      quoteError: null,
      canWithdraw: false,
      isWithdrawing: false,
      isServiceReady: true,
      isWithdrawableUnavailable: false,
      exceedsWithdrawable: mockWithdrawState.exceedsWithdrawable,
      estimatedReceive: undefined,
      executeWithdraw: jest.fn()
    }
  }
}))

jest.mock('../components/PerpsApiDownState', () => ({
  PerpsApiDownState: () => null
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
    ActivityIndicator: pass(rn.ActivityIndicator),
    Button: () => null,
    GroupList: () => null,
    useTheme: () => ({ theme: { colors: { $textPrimary: '#fff' } } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TokenUnitInputWidget: (props: any) => {
      mockWidgetProps.current = props
      return null
    }
  }
})

import { PerpetualsWithdrawScreen } from './PerpetualsWithdrawScreen'

const usdc = (subUnits: bigint): TokenUnit => new TokenUnit(subUnits, 6, 'USDC')

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<PerpetualsWithdrawScreen />)
  })
  return instance
}

describe('PerpetualsWithdrawScreen amount precision', () => {
  beforeEach(() => {
    mockWidgetProps.current = undefined
    mockWithdrawArgs.length = 0
    mockWithdrawState.withdrawableUsd = 44.148877
    mockWithdrawState.exceedsWithdrawable = false
  })

  it('keeps the full-precision Max amount instead of display-rounding it up', async () => {
    await render()
    // Max on a 44.148877 balance emits the exact balance; the old
    // toDisplay({asNumber: true}) path rounded it up to 44.1489 which the hook
    // then rejected as exceeding the withdrawable.
    await act(async () => {
      mockWidgetProps.current.onChange(usdc(44148877n))
    })
    expect(mockWithdrawArgs[mockWithdrawArgs.length - 1]).toBe('44.148877')
  })

  it('floors fractional-subunit percentage amounts to USDC precision', async () => {
    await render()
    // 25% of 44.148877 = 11.03721925 — carries fractional subunits that
    // parseUnits(…, decimals) downstream would reject.
    await act(async () => {
      mockWidgetProps.current.onChange(usdc(44148877n).mul(0.25))
    })
    expect(mockWithdrawArgs[mockWithdrawArgs.length - 1]).toBe('11.037219')
  })

  it('floors the withdrawable balance passed to the widget (never offers more than available)', async () => {
    mockWithdrawState.withdrawableUsd = 44.1488779
    await render()
    expect(mockWidgetProps.current.balance.toSubUnit()).toBe(44148877n)
  })

  it('floors the max-withdrawal hint so it never names a rejected amount', async () => {
    mockWithdrawState.exceedsWithdrawable = true
    const instance = await render()
    // 2dp formatting would round 44.148877 up to "44.15 USDC" — an amount the
    // hook itself rejects as exceeding the withdrawable.
    const texts = instance.root
      .findAllByType('Text' as never)
      .map(t => t.children.join(''))
    expect(texts).toContain('Maximum withdrawal is 44.14 USDC')
  })
})
