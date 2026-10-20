import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { StakeReviewSource } from '../types'
import { resetLowUptimeAlertState } from '../utils/showLowUptimeAlert'
import StakeConfirmScreen from './StakeConfirmScreen'

// ─── Router / params ─────────────────────────────────────────────────────────
const mockBack = jest.fn()
const mockDismissAll = jest.fn()
const mockDismissTo = jest.fn()
const mockNavigation = { setOptions: jest.fn() }
let mockParams: Record<string, string | undefined> = {}
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    dismissAll: mockDismissAll,
    dismissTo: mockDismissTo
  }),
  useNavigation: () => mockNavigation,
  useLocalSearchParams: () => mockParams
}))

// ─── k2-alpine ───────────────────────────────────────────────────────────────
const mockShowAlert = jest.fn()
jest.mock('@avalabs/k2-alpine', () => {
  const react = require('react') as typeof import('react')
  const rn = require('react-native') as typeof import('react-native')
  const passthrough =
    (Component: React.ElementType) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _variant, ...props }: any) =>
      react.createElement(Component, props, children)
  return {
    ActivityIndicator: () => null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, onPress }: any) =>
      react.createElement(
        rn.Pressable,
        { onPress },
        react.createElement(rn.Text, null, children)
      ),
    // Render each row as a title + value so order and values are assertable.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GroupList: ({ data }: any) =>
      react.createElement(
        rn.View,
        null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((item: any) =>
          react.createElement(
            rn.View,
            { key: item.title },
            react.createElement(
              rn.Text,
              { testID: 'group_row_title' },
              item.title
            ),
            typeof item.value === 'string'
              ? react.createElement(rn.Text, null, item.value)
              : item.value ?? null
          )
        )
      ),
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SlidingButton: ({ onConfirm, label }: any) =>
      react.createElement(
        rn.Pressable,
        { testID: 'sliding_button', onPress: onConfirm },
        react.createElement(rn.Text, null, label)
      ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: ({ children, sx, variant: _variant, ...props }: any) =>
      react.createElement(rn.Text, { ...props, style: sx }, children),
    View: passthrough(rn.View)
  }
})

jest.mock('common/components/ScrollScreen', () => {
  const react = require('react') as typeof import('react')
  const rn = require('react-native') as typeof import('react-native')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollScreen: ({ title, renderFooter, children }: any) =>
      react.createElement(
        rn.View,
        null,
        react.createElement(rn.Text, { testID: 'screen_title' }, title),
        children,
        renderFooter?.()
      )
  }
})

// ─── Hooks the screen composes ───────────────────────────────────────────────
const mockIssueDelegation = jest.fn()
jest.mock('hooks/earn/useIssueDelegation', () => ({
  useIssueDelegation: () => ({
    issueDelegation: mockIssueDelegation,
    isPending: false,
    reset: jest.fn()
  })
}))
const mockStartLedgerDelegation = jest.fn()
jest.mock('features/stake/hooks/useLedgerStaking', () => ({
  useLedgerStaking: () => ({
    startLedgerDelegation: mockStartLedgerDelegation,
    resetLedgerState: jest.fn(),
    renderLedgerFooter: () => null
  })
}))
jest.mock('contexts/DelegationContext', () => ({
  useDelegationContext: () => ({ steps: [] })
}))
jest.mock('hooks/earn/useStakeAmount', () => {
  const { TokenUnit } = require('@avalabs/core-utils-sdk')
  const amount = new TokenUnit(25_000_000_000n, 9, 'AVAX')
  return { useStakeAmount: () => [amount, jest.fn()] }
})
jest.mock('hooks/earn/useStakingParams', () => ({
  __esModule: true,
  default: () => ({ annualPercentageYieldBPS: 750 })
}))
jest.mock('hooks/earn/useEarnCalcEstimatedRewards', () => ({
  useEarnCalcEstimatedRewards: () => ({
    data: undefined,
    isError: false,
    isFetching: false,
    refetch: jest.fn()
  })
}))
jest.mock('features/stake/utils/useValidateStakingEndTime', () => {
  const start = new Date(1_800_000_060_000)
  const defaultEnd = 1_800_000_000_000 + 30 * 24 * 60 * 60 * 1000
  return {
    // Clamp to the validator end time (unix seconds) like the real hook, so a
    // changed validator endTime is observable in the submitted endDate.
    useValidateStakingEndTime: (_selected: number, validatorEnd?: number) => ({
      minStartTime: start,
      validatedStakingEndTime: new Date(
        validatorEnd !== undefined
          ? Math.min(defaultEnd, validatorEnd * 1000)
          : defaultEnd
      ),
      validatedStakingDuration: 30 * 24 * 60 * 60
    })
  }
})
jest.mock('features/stake/utils', () => ({
  formatDurationInDays: () => '30 days',
  getRoundedDurationInDays: () => 30
}))
jest.mock('hooks/earn/useRefreshStakingBalances', () => ({
  useRefreshStakingBalances: () => jest.fn()
}))
jest.mock('hooks/time/useNow', () => ({ useNow: () => 1_800_000_000_000 }))
jest.mock('../hooks/useStakeFundingPreflight', () => ({
  useStakeFundingPreflight: () => ({
    isCheckingFunding: false,
    hasInsufficientFunds: false
  })
}))
jest.mock('../components/StakeStatusScreen', () => ({
  StakeStatusScreen: () => null
}))
jest.mock('features/stake/components/StakeTokenUnitValue', () => ({
  StakeTokenUnitValue: () => null
}))

// ─── Store / services ────────────────────────────────────────────────────────
let mockActiveWallet: { type: string } | undefined
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (state: unknown) => unknown) => selector({})
}))
jest.mock('store/account', () => ({
  selectActiveAccount: () => ({ id: 'account-1' })
}))
jest.mock('store/wallet/slice', () => ({
  selectActiveWallet: () => mockActiveWallet
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => true
}))
jest.mock('store/notifications', () => ({
  scheduleStakingCompleteNotifications: jest.fn()
}))
jest.mock('store/rpc/providers/walletConnect/utils', () => ({
  isUserRejectedError: () => false
}))
jest.mock('services/wallet/types', () => ({
  WalletType: { LEDGER: 'LEDGER', LEDGER_LIVE: 'LEDGER_LIVE' }
}))
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))
jest.mock('services/network/NetworkService', () => ({
  __esModule: true,
  default: { getAvalancheNetworkP: () => ({ explorerUrl: undefined }) }
}))
jest.mock('vmModule/utils/requestContext', () => ({ showConfetti: jest.fn() }))
jest.mock('utils/getExplorerAddressByNetwork', () => ({
  getExplorerAddressByNetwork: jest.fn()
}))
jest.mock('utils/Utils', () => ({ truncateNodeId: (id: string) => id }))
jest.mock('common/utils/clipboard', () => ({ copyToClipboard: jest.fn() }))
jest.mock('common/utils/toast', () => ({
  transactionSnackbar: { success: jest.fn() }
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STAKE_END_TIME = '1802592000'

const makeSource = (
  uptime?: string,
  endTime = '1900000000'
): StakeReviewSource => ({
  validator: {
    nodeID: 'NodeID-A',
    endTime,
    delegationFee: '2',
    ...(uptime === undefined ? {} : { uptime })
  },
  isFetching: false,
  error: null,
  feePolicy: null
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Instance = any
const hostByTestId = (root: Instance, testID: string): Instance[] =>
  root.findAll(
    (n: Instance) => typeof n.type === 'string' && n.props.testID === testID
  )
const textOf = (node: Instance): string =>
  ([] as unknown[]).concat(node.props.children).join('')
const slide = (root: Instance): unknown => {
  const button = root.findAll(
    (n: Instance) =>
      n.props.testID === 'sliding_button' &&
      typeof n.props.onPress === 'function'
  )[0]
  let returned: unknown
  act(() => {
    returned = button.props.onPress()
  })
  return returned
}
type AlertButton = { text: string; onPress?: () => void }
const uptimeAlertCalls = (): { buttons: AlertButton[] }[] =>
  mockShowAlert.mock.calls
    .map(call => call[0])
    .filter(config => config.title === 'Uptime too low')

const mounted: renderer.ReactTestRenderer[] = []

const mountScreen = async (
  source: StakeReviewSource,
  isAdvanced = true
): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <StakeConfirmScreen source={source} isAdvanced={isAdvanced} />
    )
  })
  mounted.push(instance)
  return instance
}

const renderScreen = async (
  source: StakeReviewSource,
  isAdvanced = true
): Promise<Instance> => (await mountScreen(source, isAdvanced)).root

const rerenderScreen = async (
  instance: renderer.ReactTestRenderer,
  source: StakeReviewSource
): Promise<void> => {
  await act(async () => {
    instance.update(<StakeConfirmScreen source={source} isAdvanced />)
  })
}

describe('StakeConfirmScreen', () => {
  beforeEach(() => {
    mockParams = { stakeEndTime: STAKE_END_TIME }
    mockActiveWallet = undefined
  })

  // Some cases open the alert without pressing a button; clear the
  // in-flight flag so they do not swallow the next case's alert.
  afterEach(() => {
    resetLowUptimeAlertState()
    // Unmount so trees do not leak across tests.
    act(() => {
      mounted.splice(0).forEach(r => r.unmount())
    })
  })

  it('shows the Review your stake H1', async () => {
    const root = await renderScreen(makeSource('99.91'))
    expect(textOf(hostByTestId(root, 'screen_title')[0])).toBe(
      'Review your stake'
    )
  })

  it('renders the rows in the Figma order with Uptime after APY on the advanced review', async () => {
    const root = await renderScreen(makeSource('99.91'), true)
    expect(hostByTestId(root, 'group_row_title').map(textOf)).toEqual([
      'Staked amount',
      'APY',
      'Uptime',
      'Estimated reward',
      'Time to unlock',
      'Locked until',
      'Node'
    ])
    const [value] = hostByTestId(root, 'stake_review_uptime_value')
    expect(textOf(value)).toBe('99.91%')
    expect(value.props.style.color).toBeUndefined()
  })

  it('renders the uptime value in the danger colour below the threshold', async () => {
    const root = await renderScreen(makeSource('60.11'))
    const [value] = hostByTestId(root, 'stake_review_uptime_value')
    expect(textOf(value)).toBe('60.11%')
    expect(value.props.style.color).toBe('$textDanger')
  })

  it.each([[undefined], [''], ['abc']])(
    'omits the Uptime row when uptime is %p',
    async uptime => {
      const root = await renderScreen(makeSource(uptime))
      expect(hostByTestId(root, 'group_row_title').map(textOf)).not.toContain(
        'Uptime'
      )
      expect(hostByTestId(root, 'stake_review_uptime_value')).toHaveLength(0)
    }
  )

  it('omits the Uptime row on the Fast Stake review', async () => {
    const root = await renderScreen(makeSource('60.11'), false)
    expect(hostByTestId(root, 'group_row_title').map(textOf)).toEqual([
      'Staked amount',
      'APY',
      'Estimated reward',
      'Time to unlock',
      'Locked until',
      'Node'
    ])
    expect(hostByTestId(root, 'stake_review_uptime_value')).toHaveLength(0)
  })

  it('still warns below the threshold on Fast Stake without the row', async () => {
    const root = await renderScreen(makeSource('60.11'), false)
    slide(root)
    expect(uptimeAlertCalls()).toHaveLength(1)
    expect(mockIssueDelegation).not.toHaveBeenCalled()
  })

  it('submits directly without an alert at or above the threshold', async () => {
    const root = await renderScreen(makeSource('90'))
    slide(root)
    expect(uptimeAlertCalls()).toHaveLength(0)
    expect(mockIssueDelegation).toHaveBeenCalledTimes(1)
    expect(mockIssueDelegation.mock.calls[0][0].nodeId).toBe('NodeID-A')
  })

  it('submits directly when uptime is unknown', async () => {
    const root = await renderScreen(makeSource(undefined))
    slide(root)
    expect(uptimeAlertCalls()).toHaveLength(0)
    expect(mockIssueDelegation).toHaveBeenCalledTimes(1)
  })

  it('shows the alert below the threshold and does not submit; the slide handler returns synchronously', async () => {
    const root = await renderScreen(makeSource('60.11'))
    const returned = slide(root)
    expect(returned).toBeUndefined()
    expect(uptimeAlertCalls()).toHaveLength(1)
    expect(uptimeAlertCalls()[0]?.buttons.map(b => b.text)).toEqual([
      'Continue',
      'Select a new node'
    ])
    expect(mockIssueDelegation).not.toHaveBeenCalled()
  })

  it('Continue submits exactly once', async () => {
    const root = await renderScreen(makeSource('60.11'))
    slide(root)
    expect(uptimeAlertCalls()).toHaveLength(1)
    expect(mockIssueDelegation).not.toHaveBeenCalled()
    act(() => {
      uptimeAlertCalls()[0]?.buttons[0]?.onPress?.()
    })
    expect(mockIssueDelegation).toHaveBeenCalledTimes(1)
    expect(mockDismissTo).not.toHaveBeenCalled()
  })

  it('Continue takes the Ledger branch unchanged for Ledger wallets', async () => {
    mockActiveWallet = { type: 'LEDGER' }
    const root = await renderScreen(makeSource('60.11'))
    slide(root)
    expect(uptimeAlertCalls()).toHaveLength(1)
    expect(mockStartLedgerDelegation).not.toHaveBeenCalled()
    act(() => {
      uptimeAlertCalls()[0]?.buttons[0]?.onPress?.()
    })
    expect(mockStartLedgerDelegation).toHaveBeenCalledTimes(1)
    expect(mockIssueDelegation).not.toHaveBeenCalled()
  })

  it('Select a new node returns to the node picker and never submits', async () => {
    const root = await renderScreen(makeSource('60.11'))
    slide(root)
    act(() => {
      uptimeAlertCalls()[0]?.buttons[1]?.onPress?.()
    })
    expect(mockDismissTo).toHaveBeenCalledWith(
      '/addStakeV2/delegate/selectNode'
    )
    expect(mockIssueDelegation).not.toHaveBeenCalled()
  })

  it('warns on the delegate restake entry', async () => {
    mockParams = { stakeEndTime: STAKE_END_TIME, restakeNodeId: 'NodeID-A' }
    const root = await renderScreen(makeSource('60.11'), true)
    slide(root)
    expect(uptimeAlertCalls()).toHaveLength(1)
    act(() => {
      uptimeAlertCalls()[0]?.buttons[1]?.onPress?.()
    })
    expect(mockDismissTo).toHaveBeenCalledWith(
      '/addStakeV2/delegate/selectNode'
    )
    expect(mockIssueDelegation).not.toHaveBeenCalled()
  })

  it('warns on the fast-stake (restake) entry too', async () => {
    mockParams = { stakeEndTime: STAKE_END_TIME, preferredNodeId: 'NodeID-A' }
    const root = await renderScreen(makeSource('60.11'), false)
    slide(root)
    expect(uptimeAlertCalls()).toHaveLength(1)
    act(() => {
      uptimeAlertCalls()[0]?.buttons[0]?.onPress?.()
    })
    expect(mockIssueDelegation).toHaveBeenCalledTimes(1)
  })
  it('Continue does not submit when the review became unsubmittable while the alert was open', async () => {
    const instance = await mountScreen(makeSource('60.11'))
    slide(instance.root)
    expect(uptimeAlertCalls()).toHaveLength(1)
    await rerenderScreen(instance, { ...makeSource('60.11'), isFetching: true })
    act(() => {
      uptimeAlertCalls()[0]?.buttons[0]?.onPress?.()
    })
    expect(mockIssueDelegation).not.toHaveBeenCalled()
  })

  it('Continue submits with the latest review state, not the one at slide time', async () => {
    const instance = await mountScreen(makeSource('60.11'))
    slide(instance.root)
    // Same node, earlier validator end time: the submit must carry the
    // clamped end date from the latest render, not the one at slide time.
    await rerenderScreen(instance, makeSource('60.11', '1801000000'))
    act(() => {
      uptimeAlertCalls()[0]?.buttons[0]?.onPress?.()
    })
    expect(mockIssueDelegation).toHaveBeenCalledTimes(1)
    const submitted = mockIssueDelegation.mock.calls[0][0]
    expect(submitted.nodeId).toBe('NodeID-A')
    expect(submitted.endDate.getTime()).toBe(1_801_000_000_000)
  })

  it('Continue on an alert that outlived the screen does not submit', async () => {
    const instance = await mountScreen(makeSource('60.11'))
    slide(instance.root)
    expect(uptimeAlertCalls()).toHaveLength(1)
    act(() => {
      instance.unmount()
    })
    act(() => {
      uptimeAlertCalls()[0]?.buttons[0]?.onPress?.()
    })
    expect(mockIssueDelegation).not.toHaveBeenCalled()
  })

  it('a later mount can warn again after unmounting with the alert open', async () => {
    const first = await mountScreen(makeSource('60.11'))
    slide(first.root)
    act(() => {
      first.unmount()
    })
    const root = await renderScreen(makeSource('60.11'))
    slide(root)
    expect(uptimeAlertCalls()).toHaveLength(2)
  })
})
