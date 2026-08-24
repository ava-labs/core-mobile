import { renderHook } from '@testing-library/react-hooks'
import { WalletType } from 'services/wallet/types'
import {
  useIsActiveWalletKeystoneDeprecated,
  useKeystoneDeprecation
} from './useKeystoneDeprecation'

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate })
}))

let mockIsKeystoneBlocked = false
let mockActiveWallet: { type: WalletType } | undefined

jest.mock('store/posthog', () => ({
  selectIsKeystoneBlocked: () => mockIsKeystoneBlocked
}))

jest.mock('store/wallet/slice', () => ({
  selectActiveWallet: () => mockActiveWallet
}))

// The selectors above are already stubbed to ignore state, so useSelector just
// needs to invoke them; a real store would add nothing to these assertions.
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({})
}))

describe('useKeystoneDeprecation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsKeystoneBlocked = false
    mockActiveWallet = undefined
  })

  it('does not warn for a Keystone wallet while the gate is on', () => {
    mockIsKeystoneBlocked = false

    const { result } = renderHook(() => useKeystoneDeprecation())

    expect(result.current.isKeystoneDeprecated).toBe(false)
    expect(result.current.shouldWarnForWalletType(WalletType.KEYSTONE)).toBe(
      false
    )
  })

  it('warns only for Keystone wallets once the gate is off', () => {
    mockIsKeystoneBlocked = true

    const { result } = renderHook(() => useKeystoneDeprecation())

    expect(result.current.shouldWarnForWalletType(WalletType.KEYSTONE)).toBe(
      true
    )
    expect(result.current.shouldWarnForWalletType(WalletType.MNEMONIC)).toBe(
      false
    )
    expect(result.current.shouldWarnForWalletType(WalletType.LEDGER)).toBe(
      false
    )
  })

  it('routes to the deprecation modal', () => {
    const { result } = renderHook(() => useKeystoneDeprecation())

    result.current.openDeprecationInfo()

    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/keystoneDeprecation'
    })
  })
})

describe('useIsActiveWalletKeystoneDeprecated', () => {
  beforeEach(() => {
    mockIsKeystoneBlocked = false
    mockActiveWallet = undefined
  })

  it('is true only when the gate is off AND the active wallet is Keystone', () => {
    mockIsKeystoneBlocked = true
    mockActiveWallet = { type: WalletType.KEYSTONE }

    expect(
      renderHook(() => useIsActiveWalletKeystoneDeprecated()).result.current
    ).toBe(true)
  })

  it('is false when a non-Keystone wallet is active, even with the gate off', () => {
    mockIsKeystoneBlocked = true
    mockActiveWallet = { type: WalletType.MNEMONIC }

    expect(
      renderHook(() => useIsActiveWalletKeystoneDeprecated()).result.current
    ).toBe(false)
  })

  it('is false while the gate is on, even with a Keystone wallet active', () => {
    mockIsKeystoneBlocked = false
    mockActiveWallet = { type: WalletType.KEYSTONE }

    expect(
      renderHook(() => useIsActiveWalletKeystoneDeprecated()).result.current
    ).toBe(false)
  })

  it('is false when there is no active wallet', () => {
    mockIsKeystoneBlocked = true
    mockActiveWallet = undefined

    expect(
      renderHook(() => useIsActiveWalletKeystoneDeprecated()).result.current
    ).toBe(false)
  })
})
