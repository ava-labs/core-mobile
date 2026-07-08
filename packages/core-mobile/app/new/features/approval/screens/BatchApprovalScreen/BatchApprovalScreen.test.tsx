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
      Action: {
        Info: () => null,
        Help: () => null,
        CheckCircleOutline: () => null
      },
      Navigation: { ChevronRight: () => null }
    },
    useTheme: () => ({
      theme: {
        colors: {
          $textPrimary: '#000',
          $textSecondary: '#888',
          $textDanger: '#f00',
          $textSuccess: '#0f0',
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
      onClose,
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
        // `cancel` is optional — the tx-detail steps omit it (the header back
        // button replaces the old bottom "Previous" button).
        cancel
          ? r.createElement(
              rn.TouchableOpacity,
              { testID: 'cancel_button', onPress: cancel.onPress },
              r.createElement(rn.Text, null, cancel.label)
            )
          : null,
        // Stand-in for the native gesture / hardware-back dismissal: the real
        // ActionSheet fires `onClose` from its `beforeRemove` listener when the
        // sheet is dismissed by swipe. Expose it as a pressable so tests can
        // drive that path.
        r.createElement(rn.TouchableOpacity, {
          testID: 'gesture_dismiss',
          onPress: onClose
        }),
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

// Faithful mock of the real hook's state semantics: `hashedCustomSpend` is
// component state, set only by `updateSpendLimit`, and (like the real hook) is
// NOT reset when `tokenApprovals` changes. Reproducing that persistence is what
// lets the "no cross-step override leak" test exercise the real component
// identity behavior (BatchTxStep's per-index key). A step is editable — and
// exposes an edit affordance — only when its request carries an editable
// `tokenApprovals` with a marker `calldata`.
jest.mock('hooks/useSpendLimits', () => {
  const r = require('react') as typeof import('react')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useSpendLimits: (tokenApprovals: any) => {
      const [hashedCustomSpend, setHashed] = r.useState<string | undefined>(
        undefined
      )
      const updateSpendLimit = r.useCallback(() => {
        setHashed(tokenApprovals ? tokenApprovals.calldata : undefined)
      }, [tokenApprovals])
      return {
        spendLimits: tokenApprovals
          ? [{ limitType: 'DEFAULT', tokenApproval: {} }]
          : [],
        canEdit: Boolean(tokenApprovals && tokenApprovals.isEditable),
        updateSpendLimit,
        hashedCustomSpend
      }
    },
    Limit: { DEFAULT: 'DEFAULT', UNLIMITED: 'UNLIMITED', CUSTOM: 'CUSTOM' }
  }
})

jest.mock('../../components/Account', () => ({ Account: () => null }))
jest.mock('../../components/Network', () => ({ Network: () => null }))
jest.mock('../../components/AccountNetworkCard', () => ({
  AccountNetworkCard: () => null
}))
jest.mock('../../components/NetworkFeeSelectorWithGasless', () => ({
  NetworkFeeSelectorWithGasless: () => null
}))

// The overview derives its network from the active-network list via useNetworks
// (which reads Redux); stub it so the screen renders without a store Provider.
jest.mock('hooks/networks/useNetworks', () => ({
  useNetworks: () => ({ getNetwork: jest.fn(() => undefined) })
}))

// useEffectiveHeaderHeight pulls in expo-router/react-navigation (which imports
// a PNG asset Jest can't parse); stub it to a fixed height.
jest.mock('common/hooks/useEffectiveHeaderHeight', () => ({
  useEffectiveHeaderHeight: () => 100
}))
jest.mock('common/components/BackBarButton', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('common/components/ProgressDots', () => ({
  ProgressDots: () => null
}))
jest.mock('hooks/useGasless', () => ({
  useGasless: () => ({
    gaslessEnabled: false,
    setGaslessEnabled: jest.fn(),
    shouldShowGaslessSwitch: false,
    gaslessError: null,
    handleGaslessTx: jest.fn()
  })
}))
jest.mock('../../components/BalanceChange/BalanceChange', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('../../components/Details', () => ({ Details: () => null }))
// Render an "edit" affordance only when the step is editable (onSelect passed).
// Pressing it drives `updateSpendLimit`, the user action that produces an
// override.
jest.mock('../../components/SpendLimits/SpendLimits', () => {
  const r = require('react') as typeof import('react')
  const rn = require('react-native') as typeof import('react-native')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpendLimits: ({ onSelect }: any) =>
      onSelect
        ? r.createElement(rn.TouchableOpacity, {
            testID: 'edit_spend_limit',
            onPress: () => onSelect({ limitType: 'CUSTOM' })
          })
        : null
  }
})

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

const buildSigningRequest = (
  index: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tokenApprovals?: any
): any => ({
  displayData: {
    title: `Transaction ${index}`,
    details: [],
    account: '0xabc',
    network: { chainId: 43114, name: 'Avalanche' },
    ...(tokenApprovals ? { tokenApprovals } : {})
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
    // Gasless is intentionally not offered on the batch screen (no batch
    // broadcast-path funding hook), so onApprove is called with overrides only.
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

  it('does NOT leak an edited spend limit onto the next transaction (CP-14641)', () => {
    // Step 0 is an editable ERC-20 approval; step 1 is not. Editing step 0's
    // spend limit then advancing must register the override against index 0
    // only — never index 1. A regression (a reused BatchTxStep instance whose
    // stale `hashedCustomSpend` re-fires on the index change) would sign the
    // step-0 approve calldata as the step-1 transaction.
    const params = buildParams(2, {
      signingRequests: [
        buildSigningRequest(0, { isEditable: true, calldata: '0xEDITED0' }),
        buildSigningRequest(1)
      ]
    })
    let instance!: renderer.ReactTestRenderer
    act(() => {
      instance = renderer.create(<BatchApprovalScreen params={params} />)
    })
    pressTestID(instance, 'see_details_button') // -> step 1 of 2 (index 0)
    pressTestID(instance, 'edit_spend_limit') // edit spend limit on step 0
    pressTestID(instance, 'confirm_button') // Next -> step 2 of 2 (index 1)
    pressTestID(instance, 'confirm_button') // Next -> final confirm
    pressTestID(instance, 'confirm_button') // Approve all
    expect(params.onApprove).toHaveBeenCalledWith({ 0: '0xEDITED0' })
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

  it('rejects the request WITHOUT an extra router.back() on a gesture dismissal', () => {
    // A swipe-down dismissal already pops this sheet natively. `rejectAndClose`
    // would call router.back() a second time, popping the screen underneath
    // (e.g. the Swap sheet). The gesture path (ActionSheet.onClose) must only
    // reject the pending request and let the native pop handle navigation.
    const router = jest.requireMock('expo-router').router
    const params = buildParams(1)
    let instance!: renderer.ReactTestRenderer
    act(() => {
      instance = renderer.create(<BatchApprovalScreen params={params} />)
    })
    pressTestID(instance, 'gesture_dismiss')
    expect(params.onReject).toHaveBeenCalled()
    expect(router.back).not.toHaveBeenCalled()
  })
})
