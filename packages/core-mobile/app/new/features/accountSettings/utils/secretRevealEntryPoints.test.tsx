/**
 * WSR-PHYS-003: the risk warning must be shown BEFORE navigating into any
 * recovery phrase / private key reveal flow, and navigation must only happen
 * when the user taps Continue.
 */
import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { WalletType } from 'services/wallet/types'
import { CoreAccountType } from '@avalabs/types'

type Item = { title: string; onPress?: () => void }
type AlertButton = { text: string; onPress?: () => void }

const mockShowAlert = jest.fn()
const mockGroupLists: Item[][] = []
let mockWalletInfoProps: { onShowPrivateKey?: () => void } = {}

jest.mock('@avalabs/k2-alpine', () => ({
  showAlert: (...args: unknown[]) => mockShowAlert(...args),
  GroupList: ({ data }: { data: Item[] }) => {
    mockGroupLists.push(data)
    return null
  },
  Text: () => null,
  Toggle: () => null,
  View: ({ children }: { children: React.ReactNode }) => children,
  BalanceHeader: () => null,
  useTheme: () => ({ theme: { colors: {} } })
}))

jest.mock('common/components/ScrollScreen', () => ({
  ScrollScreen: ({ children }: { children: React.ReactNode }) => children
}))

const mockNavigate = jest.fn()
const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush }),
  useLocalSearchParams: () => ({ accountId: 'account-1' })
}))

const mockWallet = { id: 'wallet-1', type: WalletType.MNEMONIC, name: 'W' }
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

const mockAccount = {
  id: 'account-1',
  walletId: 'wallet-1',
  index: 2,
  name: 'Account 3',
  type: CoreAccountType.PRIMARY
}
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (s: unknown) => unknown) => selector({})
}))
jest.mock('store/settings/securityPrivacy', () => ({
  selectCoreAnalyticsConsent: () => false,
  selectLockWalletWithPIN: () => true,
  selectIsPrivacyModeEnabled: () => false,
  setCoreAnalytics: jest.fn(),
  setLockWalletWithPIN: jest.fn()
}))
jest.mock('store/account', () => ({
  selectAccountById: () => () => mockAccount,
  selectActiveAccount: () => mockAccount
}))
jest.mock('common/hooks/useInAppBrowser', () => ({
  __esModule: true,
  default: () => ({ openUrl: jest.fn(() => Promise.resolve()) })
}))
jest.mock('store/wallet/slice', () => ({
  selectWalletById: () => () => mockWallet
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => false
}))
jest.mock('store/settings/currency', () => ({
  selectSelectedCurrency: () => 'USD'
}))
jest.mock('common/hooks/useFormatCurrency', () => ({
  useFormatCurrency: () => ({ formatCurrency: () => '$0' })
}))
jest.mock('features/portfolio/hooks/useAccountBalanceSummary', () => ({
  useAccountBalanceSummary: () => ({
    totalBalanceInCurrency: 0,
    isBalanceLoaded: true,
    isLoading: false,
    isRefetching: false,
    isAllBalancesInaccurate: false
  })
}))
jest.mock('features/wallets/utils/formatBalanceDisplay', () => ({
  formatBalanceDisplay: () => '$0'
}))
jest.mock('features/accountSettings/components/accountAddresses', () => ({
  AccountAddresses: () => null
}))
jest.mock('features/accountSettings/components/AccountButtons', () => ({
  AccountButtons: () => null
}))
jest.mock('features/accountSettings/components/WalletInfo', () => ({
  WalletInfo: (props: { onShowPrivateKey?: () => void }) => {
    mockWalletInfoProps = props
    return null
  }
}))
jest.mock('services/analytics/AnalyticsService', () => ({
  capture: jest.fn()
}))
jest.mock('utils/BiometricsSDK', () => ({ disableBiometry: jest.fn() }))

import SecurityAndPrivacyScreen from 'new/routes/(signedIn)/(modals)/accountSettings/securityAndPrivacy'

import AccountScreen from 'new/routes/(signedIn)/(modals)/accountSettings/account'

const lastAlertButtons = (): AlertButton[] =>
  mockShowAlert.mock.calls[mockShowAlert.mock.calls.length - 1][0].buttons

const pressButton = (text: string): void => {
  const button = lastAlertButtons().find(b => b.text === text)
  expect(button).toBeDefined()
  act(() => button?.onPress?.())
}

const findItem = (title: string): Item => {
  const item = mockGroupLists.flat().find(i => i.title === title)
  if (!item) throw new Error(`row "${title}" not rendered`)
  return item
}

beforeEach(() => {
  mockGroupLists.length = 0
  mockWalletInfoProps = {}
  mockWallet.type = WalletType.MNEMONIC
})

describe('Security & privacy → Show recovery phrase', () => {
  const pressShowRecoveryPhrase = (): void => {
    act(() => {
      renderer.create(<SecurityAndPrivacyScreen />)
    })
    act(() => findItem('Show recovery phrase').onPress?.())
  }

  it('shows the risk warning before navigating to PIN verification', () => {
    pressShowRecoveryPhrase()

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    expect(mockShowAlert.mock.calls[0][0].title).toBe(
      'Never share your recovery phrase'
    )
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('stays put on Cancel', () => {
    pressShowRecoveryPhrase()
    pressButton('Cancel')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to PIN verification on Continue', () => {
    pressShowRecoveryPhrase()
    pressButton('Continue')
    expect(mockNavigate).toHaveBeenCalledWith(
      '/accountSettings/recoveryPhraseVerifyPin'
    )
  })

  it('warns before the seedless export flow too', () => {
    mockWallet.type = WalletType.SEEDLESS
    pressShowRecoveryPhrase()
    expect(mockNavigate).not.toHaveBeenCalled()

    pressButton('Continue')
    expect(mockNavigate).toHaveBeenCalledWith(
      '/accountSettings/seedlessExportPhrase'
    )
  })
})

describe('Account → Show private key', () => {
  const pressShowPrivateKey = (): void => {
    act(() => {
      renderer.create(<AccountScreen />)
    })
    expect(mockWalletInfoProps.onShowPrivateKey).toBeDefined()
    act(() => mockWalletInfoProps.onShowPrivateKey?.())
  }

  it('shows the risk warning before navigating to PIN verification', () => {
    pressShowPrivateKey()

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    expect(mockShowAlert.mock.calls[0][0].title).toBe(
      'Never share your private key'
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('stays put on Cancel', () => {
    pressShowPrivateKey()
    pressButton('Cancel')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('navigates to PIN verification on Continue', () => {
    pressShowPrivateKey()
    pressButton('Continue')
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/accountSettings/verifyPinForPrivateKey',
      params: { walletId: 'wallet-1', accountIndex: '2' }
    })
  })
})
