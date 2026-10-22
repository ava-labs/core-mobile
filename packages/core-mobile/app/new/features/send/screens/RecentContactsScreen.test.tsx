import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { Keyboard, Platform } from 'react-native'
import { RecentContactsScreen } from './RecentContactsScreen'

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
  useGlobalSearchParams: () => ({})
}))

jest.mock('react-redux', () => ({
  useSelector: () => false
}))

jest.mock('common/hooks/useContacts', () => ({
  useContacts: () => ({ recentAddresses: [], contacts: [], accounts: [] })
}))

jest.mock('../context/sendContext', () => ({
  useSendContext: () => ({ resetAmount: jest.fn(), setToAddress: jest.fn() })
}))

// Capture the handlers the screen passes down instead of rendering the list.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockProps: any
jest.mock('../components/RecentContacts', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RecentContacts: (props: any) => {
    mockProps = props
    return null
  }
}))

const contact = { id: 'acc-2', type: 'account', name: 'Account 2' }

describe('RecentContactsScreen', () => {
  const originalOS = Platform.OS
  let dismissSpy: jest.SpyInstance

  beforeEach(() => {
    mockNavigate.mockClear()
    dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(jest.fn())
    act(() => {
      renderer.create(<RecentContactsScreen />)
    })
  })

  afterEach(() => {
    dismissSpy.mockRestore()
    Platform.OS = originalOS
  })

  it.each([
    ['selecting a contact', () => mockProps.onSelectContact(contact)],
    ['opening the QR scanner', () => mockProps.onGoToQrCode()],
    ['submitting an address', () => mockProps.onSubmitEditing('0xabc')]
  ])('blurs the search field before pushing on iOS (%s)', (_, push) => {
    Platform.OS = 'ios'
    push()
    expect(dismissSpy).toHaveBeenCalledTimes(1)
    expect(dismissSpy.mock.invocationCallOrder[0]).toBeLessThan(
      mockNavigate.mock.invocationCallOrder[0] ?? 0
    )
  })

  it('leaves the keyboard alone on Android', () => {
    Platform.OS = 'android'
    mockProps.onSelectContact(contact)
    mockProps.onGoToQrCode()
    expect(dismissSpy).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledTimes(2)
  })
})
