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

let mockActiveWallet: { type: WalletType } | undefined

jest.mock('store/wallet/slice', () => ({
  selectActiveWallet: () => mockActiveWallet
}))

// The selector above is already stubbed to ignore state, so useSelector just
// needs to invoke it; a real store would add nothing to these assertions.
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({})
}))

describe('useKeystoneDeprecation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveWallet = undefined
  })

  it('warns only for Keystone wallets', () => {
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
    mockActiveWallet = undefined
  })

  it('is true when the active wallet is Keystone', () => {
    mockActiveWallet = { type: WalletType.KEYSTONE }

    expect(
      renderHook(() => useIsActiveWalletKeystoneDeprecated()).result.current
    ).toBe(true)
  })

  it('is false when a non-Keystone wallet is active', () => {
    mockActiveWallet = { type: WalletType.MNEMONIC }

    expect(
      renderHook(() => useIsActiveWalletKeystoneDeprecated()).result.current
    ).toBe(false)
  })

  it('is false when there is no active wallet', () => {
    mockActiveWallet = undefined

    expect(
      renderHook(() => useIsActiveWalletKeystoneDeprecated()).result.current
    ).toBe(false)
  })
})
