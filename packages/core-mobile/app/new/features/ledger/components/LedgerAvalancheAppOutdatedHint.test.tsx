import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { FeatureGates } from 'services/posthog/types'
import { LEDGER_DEVICE_BRIEF_DELAY_MS } from 'features/ledger/consts'

const mockGetAvalancheAppVersion = jest.fn()
jest.mock('services/ledger/LedgerService', () => ({
  __esModule: true,
  default: { getAvalancheAppVersion: () => mockGetAvalancheAppVersion() }
}))

const mockState: { posthog: Record<string, unknown> } = { posthog: {} }
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(mockState)
}))

jest.mock('@avalabs/k2-alpine', () => {
  const rn = require('react-native') as typeof import('react-native')
  const r = require('react') as typeof import('react')
  const pass =
    (C: React.ElementType) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ children, sx: _sx, variant: _v, style: _s, ...rest }: any) =>
      r.createElement(C, rest, children)
  return {
    View: pass(rn.View),
    Text: pass(rn.Text),
    Icons: { Alert: { AlertCircle: () => null } },
    useTheme: () => ({ theme: { colors: {} } })
  }
})

import { LedgerAvalancheAppOutdatedHint } from './LedgerAvalancheAppOutdatedHint'

const LEDGER = FeatureGates.LEDGER_AVALANCHE_APP_RECOMMENDED_VERSION

const setRecommendedVersion = (
  recommendedVersion: string | undefined,
  enabled = true
): void => {
  mockState.posthog = {
    featureFlags: { [FeatureGates.EVERYTHING]: true, [LEDGER]: enabled },
    featureFlagPayloads:
      recommendedVersion === undefined
        ? {}
        : { [LEDGER]: { recommendedVersion } }
  }
}

const render = async (): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(<LedgerAvalancheAppOutdatedHint />)
  })
  return instance
}

const textOf = (node: renderer.ReactTestRendererJSON | string | null): string =>
  node === null || typeof node === 'string'
    ? node ?? ''
    : (node.children ?? []).map(textOf).join('')

const hintText = (instance: renderer.ReactTestRenderer): string => {
  const json = instance.toJSON()
  return Array.isArray(json) ? json.map(textOf).join('') : textOf(json)
}

const hasHint = (instance: renderer.ReactTestRenderer): boolean =>
  hintText(instance).startsWith(
    'For improved user experience, update your Avalanche app on Ledger'
  )

describe('<LedgerAvalancheAppOutdatedHint />', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockGetAvalancheAppVersion.mockReturnValue('')
    setRecommendedVersion('1.2.3')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shows the hint with both versions when the installed Avalanche app is older than recommended', async () => {
    mockGetAvalancheAppVersion.mockReturnValue('1.2.2')
    expect(hintText(await render())).toBe(
      'For improved user experience, update your Avalanche app on Ledger (1.2.2 → 1.2.3).'
    )
  })

  it('renders nothing when the installed app is up to date', async () => {
    mockGetAvalancheAppVersion.mockReturnValue('1.2.3')
    expect((await render()).toJSON()).toBeNull()
  })

  it('renders nothing when the Avalanche app version is unknown', async () => {
    expect((await render()).toJSON()).toBeNull()
  })

  it('renders nothing when the flag is off', async () => {
    setRecommendedVersion('1.2.3', false)
    mockGetAvalancheAppVersion.mockReturnValue('1.0.0')
    expect((await render()).toJSON()).toBeNull()
  })

  it('renders nothing when the payload is missing', async () => {
    setRecommendedVersion(undefined)
    mockGetAvalancheAppVersion.mockReturnValue('1.0.0')
    expect((await render()).toJSON()).toBeNull()
  })

  it('appears once the device reports an outdated version', async () => {
    const instance = await render()
    expect(hasHint(instance)).toBe(false)

    mockGetAvalancheAppVersion.mockReturnValue('1.0.0')
    await act(async () => {
      jest.advanceTimersByTime(LEDGER_DEVICE_BRIEF_DELAY_MS)
    })

    expect(hasHint(instance)).toBe(true)
  })
})
