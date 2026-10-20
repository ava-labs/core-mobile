import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { NodeValidator } from 'types/earn'
import { setDelegateNodeSelection } from '../store'
import { resetLowUptimeAlertState } from '../utils/showLowUptimeAlert'
import NodeDetailsScreen from './NodeDetailsScreen'

const mockNavigate = jest.fn()
const mockDismissTo = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, dismissTo: mockDismissTo })
}))

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
    alpha: (color: string) => color,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Button: ({ children, onPress }: any) =>
      react.createElement(
        rn.Pressable,
        { onPress, testID: `button:${children}` },
        react.createElement(rn.Text, null, children)
      ),
    Card: passthrough(rn.View),
    GroupList: () => null,
    Icons: {
      Navigation: { ExpandMore: () => null },
      Custom: { Outbound: () => null }
    },
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
    // Keep `sx` visible as `style` so tests can assert the danger colour.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Text: ({ children, sx, variant: _variant, ...props }: any) =>
      react.createElement(rn.Text, { ...props, style: sx }, children),
    useTheme: () => ({ theme: { colors: { $textPrimary: '#000' } } }),
    View: passthrough(rn.View)
  }
})

jest.mock('common/components/ScrollScreen', () => {
  const react = require('react') as typeof import('react')
  const rn = require('react-native') as typeof import('react-native')
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ScrollScreen: ({ title, renderHeader, renderFooter, children }: any) =>
      react.createElement(
        rn.View,
        null,
        title
          ? react.createElement(rn.Text, { testID: 'screen_title' }, title)
          : null,
        renderHeader?.(),
        children,
        renderFooter?.()
      )
  }
})
jest.mock('common/components/LoadingState', () => ({
  LoadingState: () => null
}))
jest.mock('common/hooks/useInAppBrowser', () => () => ({ openUrl: jest.fn() }))
jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({
    formatCurrency: ({ amount }: { amount: number }) => `$${amount}`
  })
}))
jest.mock('common/utils/clipboard', () => ({ copyToClipboard: jest.fn() }))
jest.mock('features/portfolio/hooks/useAvaxPrice', () => ({
  useAvaxPrice: () => 20
}))
jest.mock('hooks/earn/useEarnCalcEstimatedRewards', () => ({
  useEarnCalcEstimatedRewards: () => ({ data: undefined })
}))
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({})
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => true
}))
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))
jest.mock('services/earn/utils', () => {
  const { TokenUnit } = require('@avalabs/core-utils-sdk')
  return {
    getAvailableDelegationWeight: () => new TokenUnit(0n, 9, 'AVAX')
  }
})
jest.mock('services/network/NetworkService', () => ({
  __esModule: true,
  default: {
    getAvalancheNetworkP: () => ({
      networkToken: { decimals: 9, symbol: 'AVAX' }
    })
  }
}))
jest.mock('utils/Utils', () => ({
  formatLargeCurrency: (value: string) => value,
  truncateNodeId: (id: string) => id
}))
jest.mock('../components/NodeTagPill', () => ({ NodeTagPill: () => null }))

const NOW_S = Math.floor(Date.now() / 1000)
const YEAR_S = 365 * 24 * 60 * 60

const makeNode = (uptime: string): NodeValidator =>
  ({
    nodeID: 'NodeID-A',
    startTime: String(NOW_S - YEAR_S),
    endTime: String(NOW_S + YEAR_S),
    weight: '2000000000000',
    delegatorWeight: '500000000000',
    delegatorCount: '12',
    delegationFee: '2',
    uptime
  } as unknown as NodeValidator)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Instance = any
const hostByTestId = (root: Instance, testID: string): Instance[] =>
  root.findAll(
    (n: Instance) => typeof n.type === 'string' && n.props.testID === testID
  )
const textOf = (node: Instance): string =>
  ([] as unknown[]).concat(node.props.children).join('')
const press = (root: Instance, label: string): void => {
  const target = root.findAll(
    (n: Instance) =>
      n.props.testID === `button:${label}` &&
      typeof n.props.onPress === 'function'
  )[0]
  act(() => {
    target.props.onPress()
  })
}
type AlertButton = { text: string; onPress?: () => void }
const alertButtons = (): AlertButton[] => mockShowAlert.mock.calls[0][0].buttons

const mounted: renderer.ReactTestRenderer[] = []

const renderWithUptime = async (uptime: string): Promise<Instance> => {
  setDelegateNodeSelection([makeNode(uptime)], 0)
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<NodeDetailsScreen />)
  })
  mounted.push(instance)
  return instance.root
}

describe('NodeDetailsScreen', () => {
  // Unmount so the next test's store update doesn't hit a stale tree outside act.
  afterEach(() => {
    resetLowUptimeAlertState()
    act(() => {
      mounted.splice(0).forEach(r => r.unmount())
    })
  })

  it('keeps the Node details heading', async () => {
    const root = await renderWithUptime('99.91')
    const headings = root.findAll(
      (n: Instance) =>
        typeof n.type === 'string' && textOf(n) === 'Node details'
    )
    expect(headings.length).toBeGreaterThan(0)
  })

  it('renders the Figma stat labels in order and no "Time responsive" caption', async () => {
    const root = await renderWithUptime('99.91')
    expect(hostByTestId(root, 'node_details_stat_label').map(textOf)).toEqual([
      'APY',
      'Delegations (AVAX)',
      'Delegators',
      'Node staked quantity',
      'Delegation fee',
      'Uptime'
    ])
    const captions = root.findAll(
      (n: Instance) =>
        typeof n.type === 'string' && textOf(n) === 'Time responsive'
    )
    expect(captions).toHaveLength(0)
  })

  it('renders uptime with two decimals and a percent sign', async () => {
    const root = await renderWithUptime('99.91')
    const [value] = hostByTestId(root, 'node_details_uptime_value')
    expect(textOf(value)).toBe('99.91%')
  })

  it('renders uptime in the danger colour below the threshold', async () => {
    const root = await renderWithUptime('85.5')
    const [value] = hostByTestId(root, 'node_details_uptime_value')
    expect(textOf(value)).toBe('85.50%')
    expect(value.props.style).toEqual({ color: '$textDanger' })
  })

  it('renders uptime in the default style at the threshold', async () => {
    const root = await renderWithUptime('90')
    const [value] = hostByTestId(root, 'node_details_uptime_value')
    expect(value.props.style).toBeUndefined()
  })

  it('navigates straight to the amount step at or above the threshold', async () => {
    const root = await renderWithUptime('90')
    press(root, 'Select this node')
    expect(mockShowAlert).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/addStakeV2/delegate/amount'
    })
  })

  it('opens the low-uptime alert below the threshold and does not navigate', async () => {
    const root = await renderWithUptime('85.5')
    press(root, 'Select this node')
    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    expect(mockShowAlert.mock.calls[0][0].title).toBe('Uptime too low')
    expect(alertButtons().map(b => b.text)).toEqual([
      'Continue',
      'Select a new node'
    ])
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockDismissTo).not.toHaveBeenCalled()
  })

  it('Continue navigates to the amount step', async () => {
    const root = await renderWithUptime('85.5')
    press(root, 'Select this node')
    act(() => {
      alertButtons()[0]?.onPress?.()
    })
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/addStakeV2/delegate/amount'
    })
  })

  it('Select a new node returns to the node picker', async () => {
    const root = await renderWithUptime('85.5')
    press(root, 'Select this node')
    act(() => {
      alertButtons()[1]?.onPress?.()
    })
    expect(mockDismissTo).toHaveBeenCalledWith(
      '/addStakeV2/delegate/selectNode'
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('opens a single alert when Select this node is pressed twice', async () => {
    const root = await renderWithUptime('85.5')
    press(root, 'Select this node')
    press(root, 'Select this node')
    expect(mockShowAlert).toHaveBeenCalledTimes(1)
  })

  it('a later mount can warn again after unmounting with the alert open', async () => {
    const first = await renderWithUptime('85.5')
    press(first, 'Select this node')
    act(() => {
      mounted.splice(0).forEach(r => r.unmount())
    })
    const root = await renderWithUptime('85.5')
    press(root, 'Select this node')
    expect(mockShowAlert).toHaveBeenCalledTimes(2)
  })
})
