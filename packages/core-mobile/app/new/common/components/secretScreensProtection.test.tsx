/**
 * WSR-PHYS-001: every screen that reveals a recovery phrase / private key must
 * block screenshots on Android (useSecureScreen → FLAG_SECURE), show a
 * persistent screenshot warning (the only protection on iOS), and copy the
 * secret through copySecretToClipboard (auto-clears after 60s).
 */
import React from 'react'
import renderer, { act, ReactTestRenderer } from 'react-test-renderer'

const MOCK_MNEMONIC = Array(24).fill('word').join(' ')
const MOCK_PRIVATE_KEY = '0xprivatekey'

const mockUseSecureScreen = jest.fn()
jest.mock('hooks/useSecureScreen', () => ({
  useSecureScreen: () => mockUseSecureScreen()
}))

const mockCopySecret = jest.fn()
jest.mock('common/utils/clipboard', () => ({
  copySecretToClipboard: (...args: unknown[]) => mockCopySecret(...args),
  copyToClipboard: jest.fn()
}))

jest.mock('common/components/ScreenshotWarning', () => {
  const r = require('react') as typeof import('react')
  return {
    ScreenshotWarning: (props: Record<string, unknown>) =>
      r.createElement('ScreenshotWarning', props)
  }
})

jest.mock('@avalabs/k2-alpine', () => {
  const r = require('react') as typeof import('react')
  const passthrough =
    (name: string) =>
    ({ children, ...props }: { children?: React.ReactNode }) =>
      r.createElement(name, props, children)
  return {
    View: passthrough('View'),
    Text: passthrough('Text'),
    ActivityIndicator: passthrough('ActivityIndicator'),
    Button: passthrough('Button'),
    Icons: new Proxy(
      {},
      { get: () => new Proxy({}, { get: () => passthrough('Icon') }) }
    ),
    showAlert: jest.fn(),
    useTheme: () => ({ theme: { colors: {} } })
  }
})

jest.mock('common/components/ScrollScreen', () => {
  const r = require('react') as typeof import('react')
  return {
    ScrollScreen: ({
      children,
      renderFooter
    }: {
      children: React.ReactNode
      renderFooter?: () => React.ReactNode
    }) => r.createElement('ScrollScreen', null, children, renderFooter?.())
  }
})

jest.mock('common/components/MnemonicText', () => ({
  MnemonicText: () => null
}))

jest.mock('utils/sensitiveDataStore', () => ({
  sensitiveDataStore: {
    getMnemonic: () => MOCK_MNEMONIC,
    getPrivateKey: () => MOCK_PRIVATE_KEY
  }
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true }),
  useNavigation: () => ({ getParent: () => ({ setOptions: jest.fn() }) }),
  useFocusEffect: jest.fn()
}))

jest.mock(
  'features/accountSettings/context/SeedlessMnemonicExportProvider',
  () => ({
    useSeedlessMnemonicExportContext: () => ({
      deleteExport: jest.fn(),
      completeExport: jest.fn(),
      mnemonic: MOCK_MNEMONIC
    }),
    getConfirmCloseDelayText: () => ''
  })
)
jest.mock('services/analytics/AnalyticsService', () => ({ capture: jest.fn() }))
jest.mock('common/components/BackBarButton', () => () => null)
jest.mock('common/components/NavigationBarButton', () => () => null)
jest.mock('new/common/utils/toast', () => ({ showSnackbar: jest.fn() }))

import ShowRecoveryPhraseScreen from 'new/routes/(signedIn)/(modals)/accountSettings/showRecoveryPhrase'

import ViewPrivateKeyScreen from 'new/routes/(signedIn)/(modals)/accountSettings/viewPrivateKey'

import SeedlessExportReadyScreen from 'new/routes/(signedIn)/(modals)/accountSettings/seedlessExportPhrase/readyToExport'

import { RecoveryPhrase } from 'features/onboarding/components/RecoveryPhrase'

const render = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer | undefined
  act(() => {
    tree = renderer.create(element)
  })
  if (!tree) throw new Error('render failed')
  return tree
}

const screenshotWarnings = (
  tree: ReactTestRenderer
): renderer.ReactTestInstance[] =>
  tree.root.findAll(node => (node.type as unknown) === 'ScreenshotWarning')

const pressButtonWithTestID = (
  tree: ReactTestRenderer,
  testID: string
): void => {
  const button = tree.root.find(
    node => (node.type as unknown) === 'Button' && node.props.testID === testID
  )
  act(() => {
    button.props.onPress()
  })
}

const pressButtonWithText = (tree: ReactTestRenderer, text: string): void => {
  const button = tree.root.find(
    node => (node.type as unknown) === 'Button' && node.props.children === text
  )
  act(() => {
    button.props.onPress()
  })
}

describe.each([
  ['Settings → Show recovery phrase', () => <ShowRecoveryPhraseScreen />],
  ['Settings → View private key', () => <ViewPrivateKeyScreen />],
  ['Seedless export → ready to export', () => <SeedlessExportReadyScreen />],
  [
    'Onboarding → recovery phrase',
    () => (
      <RecoveryPhrase
        onNext={jest.fn()}
        mnemonic={MOCK_MNEMONIC}
        isLoading={false}
      />
    )
  ]
])('%s', (_name, element) => {
  it('enables Android secure screen (FLAG_SECURE)', () => {
    render(element())
    expect(mockUseSecureScreen).toHaveBeenCalled()
  })

  it('shows a persistent screenshot warning', () => {
    const tree = render(element())
    expect(screenshotWarnings(tree)).toHaveLength(1)
  })
})

describe('copying secrets uses the auto-clearing clipboard helper', () => {
  it('recovery phrase (settings / onboarding)', () => {
    const tree = render(<ShowRecoveryPhraseScreen />)
    pressButtonWithTestID(tree, 'mnemonic_screen__copy_phrase_button')
    expect(mockCopySecret).toHaveBeenCalledWith(MOCK_MNEMONIC)
  })

  it('private key', () => {
    const tree = render(<ViewPrivateKeyScreen />)
    pressButtonWithText(tree, 'Copy key')
    expect(mockCopySecret).toHaveBeenCalledWith(
      MOCK_PRIVATE_KEY,
      expect.stringContaining('60 seconds')
    )
  })

  it('private key screen labels the screenshot warning correctly', () => {
    const tree = render(<ViewPrivateKeyScreen />)
    expect(screenshotWarnings(tree)[0]?.props.secretLabel).toBe('private key')
  })
})
