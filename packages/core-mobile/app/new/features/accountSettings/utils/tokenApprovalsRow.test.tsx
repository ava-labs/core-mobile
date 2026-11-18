/**
 * WSR-PERM-005: Security & privacy exposes a "Token approvals" row that opens
 * Core's own revoke-access tool (test.core.app in developer mode).
 */
import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { WalletType } from 'services/wallet/types'

type Item = { title: string; subtitle?: string; onPress?: () => void }

const mockGroupLists: Item[][] = []
jest.mock('@avalabs/k2-alpine', () => ({
  showAlert: jest.fn(),
  GroupList: ({ data }: { data: Item[] }) => {
    mockGroupLists.push(data)
    return null
  },
  Text: () => null,
  Toggle: () => null,
  useTheme: () => ({ theme: { colors: {} } })
}))

jest.mock('common/components/ScrollScreen', () => ({
  ScrollScreen: ({ children }: { children: React.ReactNode }) => children
}))

const mockOpenUrl = jest.fn(() => Promise.resolve())
jest.mock('common/hooks/useInAppBrowser', () => ({
  __esModule: true,
  default: () => ({ openUrl: mockOpenUrl })
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() })
}))
const mockWallet = { id: 'wallet-1', type: WalletType.MNEMONIC }
jest.mock('common/hooks/useActiveWallet', () => ({
  useActiveWallet: () => mockWallet
}))
jest.mock('features/accountSettings/hooks/useConnectedDapps', () => ({
  useConnectedDapps: () => ({ allApprovedDapps: [] })
}))
jest.mock('common/hooks/useStoredBiometrics', () => ({
  useStoredBiometrics: () => ({
    biometricType: 'Face ID',
    isBiometricAvailable: false,
    useBiometrics: false,
    setUseBiometrics: jest.fn()
  })
}))

const mockState = {
  isDeveloperMode: false
}
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (s: unknown) => unknown) => selector({})
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => mockState.isDeveloperMode
}))
jest.mock('store/settings/securityPrivacy', () => ({
  selectCoreAnalyticsConsent: () => false,
  selectLockWalletWithPIN: () => true,
  setCoreAnalytics: jest.fn(),
  setLockWalletWithPIN: jest.fn()
}))
jest.mock('services/analytics/AnalyticsService', () => ({ capture: jest.fn() }))
jest.mock('utils/BiometricsSDK', () => ({ disableBiometry: jest.fn() }))

import SecurityAndPrivacyScreen from 'new/routes/(signedIn)/(modals)/accountSettings/securityAndPrivacy'

const renderScreen = (): void => {
  mockGroupLists.length = 0
  act(() => {
    renderer.create(<SecurityAndPrivacyScreen />)
  })
}

const findRow = (title: string): Item | undefined =>
  mockGroupLists.flat().find(item => item.title === title)

beforeEach(() => {
  jest.clearAllMocks()
  mockState.isDeveloperMode = false
})

describe('Security & privacy → Token approvals', () => {
  it('renders the row with a first-party subtitle', () => {
    renderScreen()
    const row = findRow('Token approvals')
    expect(row).toBeDefined()
    expect(row?.subtitle).toBe('Review and revoke token approvals in Core Web')
    expect(findRow('Connected sites')).toBeDefined()
  })

  it("opens Core's revoke-access tool", () => {
    renderScreen()
    act(() => findRow('Token approvals')?.onPress?.())
    expect(mockOpenUrl).toHaveBeenCalledWith(
      'https://core.app/tools/revoke-access'
    )
  })

  it('uses test.core.app in developer mode', () => {
    mockState.isDeveloperMode = true
    renderScreen()
    act(() => findRow('Token approvals')?.onPress?.())
    expect(mockOpenUrl).toHaveBeenCalledWith(
      'https://test.core.app/tools/revoke-access'
    )
  })
})
