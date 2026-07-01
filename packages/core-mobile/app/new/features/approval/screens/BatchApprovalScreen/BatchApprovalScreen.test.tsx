import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { RpcMethod } from '@avalabs/vm-module-types'
import type { BatchApprovalScreenParams } from 'services/walletconnectv2/walletConnectCache/types'

// Mock @avalabs/k2-alpine with plain RN primitives so components render
// without needing a dripsy theme provider.
jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')

  const passthrough =
    (Cmp: any) =>
    ({
      children,
      sx: _sx,
      variant: _v,
      ...rest
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any) =>
      r.createElement(Cmp, rest, children)

  const Button = ({
    children,
    onPress,
    disabled,
    isLoading: _isLoading,
    sx: _sx,
    ...rest
  }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any) =>
    r.createElement(
      rn.TouchableOpacity,
      { onPress, disabled, ...rest },
      typeof children === 'string'
        ? r.createElement(rn.Text, null, children)
        : children
    )

  return {
    Text: passthrough(rn.Text),
    View: passthrough(rn.View),
    Button,
    Separator: () => null,
    GroupList: () => null,
    ActivityIndicator: () => null,
    Toggle: () => null,
    Icons: {
      Social: { RemoveModerator: () => null },
      Device: { GPPMaybe: () => null },
      Action: { Info: () => null },
      Navigation: { ChevronRight: () => null }
    },
    useTheme: () => ({
      theme: {
        colors: {
          $textPrimary: '#000',
          $textSecondary: '#888',
          $textDanger: '#f00',
          $surfaceSecondary: '#eee'
        },
        isDark: false
      }
    }),
    alpha: (c: string) => c,
    showAlert: jest.fn()
  }
})

// The real ActionSheet composes ScrollScreen (reanimated / gesture-handler /
// safe-area-context) which is heavy to stand up in a unit test. Mock it at
// the boundary: render title/children plainly and expose confirm/cancel as
// simple pressable buttons via testID so the state machine can be driven with
// fireEvent-style `.props.onPress()` calls.
jest.mock('new/common/components/ActionSheet', () => {
  const r = require('react') as typeof import('react')
  const rn = require('react-native') as typeof import('react-native')
  return {
    ActionSheet: ({
      title,
      confirm,
      cancel,
      children
    }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any) =>
      r.createElement(
        rn.View,
        null,
        title ? r.createElement(rn.Text, null, title) : null,
        r.createElement(
          rn.TouchableOpacity,
          { testID: 'confirm_button', onPress: confirm.onPress },
          r.createElement(rn.Text, null, confirm.label)
        ),
        r.createElement(
          rn.TouchableOpacity,
          { testID: 'cancel_button', onPress: cancel.onPress },
          r.createElement(rn.Text, null, cancel.label)
        ),
        children
      )
  }
})

jest.mock('expo-router', () => ({
  router: {
    canGoBack: jest.fn(() => true),
    back: jest.fn(),
    canDismiss: jest.fn(() => false),
    dismissAll: jest.fn()
  },
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) })
}))

jest.mock('features/approval/hooks/useDismissOnCancelledRequest', () => ({
  useDismissOnCancelledRequest: jest.fn()
}))

jest.mock('features/approval/hooks/useRecurringApprovalContext', () => ({
  useRecurringApprovalContext: jest.fn(() => ({
    recurringContext: undefined,
    isRecurringContextMalformed: false
  }))
}))

jest.mock('features/approval/components/RecurrenceDetails', () => ({
  RecurrenceDetails: () => null
}))

jest.mock('hooks/useSpendLimits', () => ({
  useSpendLimits: jest.fn(() => ({
    spendLimits: [],
    canEdit: false,
    updateSpendLimit: jest.fn(),
    hashedCustomSpend: undefined
  })),
  Limit: { DEFAULT: 'DEFAULT', UNLIMITED: 'UNLIMITED', CUSTOM: 'CUSTOM' }
}))

jest.mock('../../components/Account', () => ({ Account: () => null }))
jest.mock('../../components/Network', () => ({ Network: () => null }))
jest.mock('../../components/BalanceChange/BalanceChange', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('../../components/Details', () => ({ Details: () => null }))
jest.mock('../../components/SpendLimits/SpendLimits', () => ({
  SpendLimits: () => null
}))

jest.mock('common/components/withWalletConnectCache', () => ({
  withWalletConnectCache: () => (Component: unknown) => Component
}))

import { useRecurringApprovalContext } from 'features/approval/hooks/useRecurringApprovalContext'
import { BatchApprovalScreen } from './BatchApprovalScreen'

const mockUseRecurringApprovalContext = useRecurringApprovalContext as jest.Mock

function findByText(
  json:
    | renderer.ReactTestRendererJSON
    | renderer.ReactTestRendererJSON[]
    | string
    | null
    | undefined,
  needle: string
): boolean {
  if (json === null || json === undefined) return false
  if (Array.isArray(json)) return json.some(child => findByText(child, needle))
  if (typeof json === 'string') return json.includes(needle)
  if ('children' in json && json.children) {
    return (json.children as (renderer.ReactTestRendererJSON | string)[]).some(
      child => findByText(child, needle)
    )
  }
  return false
}

function pressTestID(
  instance: renderer.ReactTestRenderer,
  testID: string
): void {
  const node = instance.root.findByProps({ testID })
  act(() => {
    node.props.onPress()
  })
}

const buildSigningRequest = (index: number): any => ({
  displayData: {
    title: `Transaction ${index}`,
    details: [],
    account: '0xabc',
    network: { chainId: 43114, name: 'Avalanche' }
  },
  signingData: {
    type: RpcMethod.ETH_SEND_TRANSACTION,
    account: '0xabc',
    data: {}
  }
})

const buildParams = (
  txCount: number,
  overrides: Partial<BatchApprovalScreenParams> = {}
): BatchApprovalScreenParams =>
  ({
    request: { chainId: 'eip155:43114' } as any,
    displayData: {
      title: 'Approve transactions',
      details: [],
      account: '0xabc',
      network: { chainId: 43114, name: 'Avalanche' }
    },
    signingRequests: Array.from({ length: txCount }, (_, i) =>
      buildSigningRequest(i)
    ),
    onApprove: jest.fn(),
    onReject: jest.fn(),
    ...overrides
  } as BatchApprovalScreenParams)

describe('BatchApprovalScreen', () => {
  beforeEach(() => {
    // jest.config sets clearMocks: true, which wipes the mock's default
    // implementation between tests — restore the well-formed default here.
    mockUseRecurringApprovalContext.mockReturnValue({
      recurringContext: undefined,
      isRecurringContextMalformed: false
    })
  })

  it('renders null (no "Approve all" button) when the recurring context is malformed', () => {
    mockUseRecurringApprovalContext.mockReturnValue({
      recurringContext: undefined,
      isRecurringContextMalformed: true
    })
    const params = buildParams(3)
    let instance!: renderer.ReactTestRenderer
    act(() => {
      instance = renderer.create(<BatchApprovalScreen params={params} />)
    })
    const json = instance.toJSON()
    expect(json).toBeNull()
    expect(findByText(json, 'Approve all')).toBe(false)
  })

  it('shows the overview title and an "Approve all" button on page 0', () => {
    const params = buildParams(3)
    let instance!: renderer.ReactTestRenderer
    act(() => {
      instance = renderer.create(<BatchApprovalScreen params={params} />)
    })
    const json = instance.toJSON()
    expect(findByText(json, 'Approve transactions')).toBe(true)
    expect(findByText(json, 'Approve all')).toBe(true)
  })

  it('calls onApprove with the current overrides when "Approve all" is pressed on the overview', () => {
    const params = buildParams(3)
    let instance!: renderer.ReactTestRenderer
    act(() => {
      instance = renderer.create(<BatchApprovalScreen params={params} />)
    })
    pressTestID(instance, 'confirm_button')
    expect(params.onApprove).toHaveBeenCalledWith({})
  })

  it('advances to "Transaction 1 of N" when "See details" is pressed', () => {
    const params = buildParams(3)
    let instance!: renderer.ReactTestRenderer
    act(() => {
      instance = renderer.create(<BatchApprovalScreen params={params} />)
    })
    pressTestID(instance, 'see_details_button')
    const json = instance.toJSON()
    expect(findByText(json, 'Transaction 1 of 3')).toBe(true)
  })

  it('reaches the final confirm page after advancing through all steps', () => {
    const params = buildParams(2)
    let instance!: renderer.ReactTestRenderer
    act(() => {
      instance = renderer.create(<BatchApprovalScreen params={params} />)
    })
    pressTestID(instance, 'see_details_button') // -> step 1 of 2
    pressTestID(instance, 'confirm_button') // Next -> step 2 of 2
    pressTestID(instance, 'confirm_button') // Review -> final confirm
    const json = instance.toJSON()
    expect(findByText(json, 'Do you want to approve all transactions?')).toBe(
      true
    )
  })

  it('calls onReject when "Reject" is pressed', () => {
    const params = buildParams(1)
    let instance!: renderer.ReactTestRenderer
    act(() => {
      instance = renderer.create(<BatchApprovalScreen params={params} />)
    })
    pressTestID(instance, 'cancel_button')
    expect(params.onReject).toHaveBeenCalled()
  })
})
