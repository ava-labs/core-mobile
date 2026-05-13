import { renderHook, act } from '@testing-library/react-hooks'
import { CoreAccountType } from '@avalabs/types'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import { useSelector } from 'react-redux'

// Import mock accounts from fixture
import mockAccountsData from '../../../../tests/fixtures/accounts.json'

import { useDeriveAddresses } from './useDeriveAddresses'

// Mock react-redux useSelector
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn()
}))

// Mock store/account to prevent dependency chain issues
jest.mock('store/account', () => ({
  selectAccounts: jest.fn()
}))

// Mock the native Nitro crypto module — the hook now derives every
// secp256k1 address in C++ via deriveAllAddressesFromPrivateKey.
jest.mock('react-native-nitro-avalabs-crypto', () => ({
  deriveAllAddressesFromPrivateKey: jest.fn()
}))

// Mock the core-utils-sdk
jest.mock('@avalabs/core-utils-sdk', () => ({
  strip0x: jest.fn()
}))

// Mock uuid utility
jest.mock('utils/uuid', () => ({
  uuid: jest.fn()
}))

// Mock Logger
jest.mock('utils/Logger', () => ({
  info: jest.fn()
}))

describe('useDeriveAddresses', () => {
  const mockEvmAddress = '0x1234567890123456789012345678901234567890'
  const mockBtcAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  const mockTestnetBtcAddress = 'tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  const mockAvmAddress = 'X-avax1mockxavmaddress'
  const mockPvmAddress = 'P-avax1mockpvmaddress'
  const mockCoreEthAddress = 'C-avax1mockcorethaddress'
  const mockSvmAddress = '7vT2YkkAcCFR4dBHbKLuFePZUchA3aDZUYrQk83eYTBL'
  const mockUuid = 'mock-uuid-1234'
  const validPrivateKey =
    'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  const invalidPrivateKey = 'invalid-key'
  const emptyPrivateKey = ''

  beforeEach(() => {
    jest.clearAllMocks()

    // Get the mocked selectAccounts function
    const { selectAccounts } = require('store/account')

    // Mock selectAccounts to return our fixture accounts
    selectAccounts.mockReturnValue(mockAccountsData)

    // Setup useSelector mock to work with selectors
    ;(
      useSelector as jest.MockedFunction<typeof useSelector>
    ).mockImplementation(selector => {
      // If the selector is selectAccounts, return the mock accounts directly
      if (selector === selectAccounts) {
        return mockAccountsData
      }
      // For any other selector, call it with a mock state
      return selector({ account: { accounts: mockAccountsData } })
    })

    // Setup default mocks — native call returns the full secp256k1 address
    // set; the hook reads .evm and .btc.
    const {
      deriveAllAddressesFromPrivateKey
    } = require('react-native-nitro-avalabs-crypto')
    const { strip0x } = require('@avalabs/core-utils-sdk')
    const { uuid } = require('utils/uuid')

    strip0x.mockImplementation((key: string) => key.replace('0x', ''))
    deriveAllAddressesFromPrivateKey.mockImplementation(
      (_pk: string, isTestnet: boolean) => ({
        accountIndex: 0,
        evm: mockEvmAddress,
        btc: isTestnet ? mockTestnetBtcAddress : mockBtcAddress,
        avm: mockAvmAddress,
        pvm: mockPvmAddress,
        coreEth: mockCoreEthAddress,
        solana: mockSvmAddress
      })
    )
    uuid.mockReturnValue(mockUuid)
  })

  afterEach(() => {
    ;(useSelector as jest.MockedFunction<typeof useSelector>).mockClear()
    jest.restoreAllMocks()
  })

  describe('Redux mocking', () => {
    it('should properly mock useSelector and return accounts', async () => {
      const { result } = renderHook(() =>
        useDeriveAddresses(validPrivateKey, false)
      )

      // Wait for the async deriveAddresses to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Verify that useSelector was called and returned the expected data
      expect(useSelector).toHaveBeenCalled()

      // The hook should have access to the mocked accounts
      // The temp account name is always "Account 1" for private key imports
      expect(result.current.tempAccountDetails?.name).toBe('Account 1')
    })
  })

  describe('with valid private key', () => {
    it('should derive addresses successfully for mainnet', async () => {
      const { result } = renderHook(() =>
        useDeriveAddresses(validPrivateKey, false)
      )

      // Wait for the async deriveAddresses to complete
      await act(async () => {
        // Give time for the useEffect and async function to complete
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const {
        deriveAllAddressesFromPrivateKey
      } = require('react-native-nitro-avalabs-crypto')

      expect(deriveAllAddressesFromPrivateKey).toHaveBeenCalledWith(
        validPrivateKey,
        false
      )

      expect(result.current.derivedAddresses).toEqual([
        { address: mockEvmAddress, symbol: 'AVAX' },
        { address: mockBtcAddress, symbol: 'BTC' }
      ])

      expect(result.current.tempAccountDetails).toEqual({
        id: mockUuid,
        index: 0,
        name: 'Account 1',
        type: CoreAccountType.IMPORTED,
        walletId: CORE_MOBILE_WALLET_ID,
        addressC: mockEvmAddress,
        addressBTC: mockBtcAddress,
        addressAVM: mockAvmAddress,
        addressPVM: mockPvmAddress,
        addressCoreEth: mockCoreEthAddress,
        addressSVM: mockSvmAddress
      })

      expect(result.current.showDerivedInfo).toBe(true)
    })

    it('should derive addresses successfully for testnet', async () => {
      const { result } = renderHook(() =>
        useDeriveAddresses(validPrivateKey, true)
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const {
        deriveAllAddressesFromPrivateKey
      } = require('react-native-nitro-avalabs-crypto')

      expect(deriveAllAddressesFromPrivateKey).toHaveBeenCalledWith(
        validPrivateKey,
        true
      )

      expect(result.current.derivedAddresses).toEqual([
        { address: mockEvmAddress, symbol: 'AVAX' },
        { address: mockTestnetBtcAddress, symbol: 'BTC' }
      ])

      expect(result.current.showDerivedInfo).toBe(true)
    })

    it('should handle private key with 0x prefix', async () => {
      const privateKeyWithPrefix = `0x${validPrivateKey}`
      const { strip0x } = require('@avalabs/core-utils-sdk')

      const { result } = renderHook(() =>
        useDeriveAddresses(privateKeyWithPrefix, false)
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(strip0x).toHaveBeenCalledWith(privateKeyWithPrefix)
      expect(result.current.derivedAddresses).toHaveLength(2)
      expect(result.current.showDerivedInfo).toBe(true)
    })
  })

  describe('with invalid private key', () => {
    it('should handle invalid private key length', async () => {
      const shortPrivateKey = 'abc123'

      const { result } = renderHook(() =>
        useDeriveAddresses(shortPrivateKey, false)
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.derivedAddresses).toEqual([])
      expect(result.current.tempAccountDetails).toBeNull()
      expect(result.current.showDerivedInfo).toBe(false)
    })

    it('should handle derivation errors gracefully', async () => {
      const {
        deriveAllAddressesFromPrivateKey
      } = require('react-native-nitro-avalabs-crypto')
      const Logger = require('utils/Logger')

      // Mock function to throw an error
      deriveAllAddressesFromPrivateKey.mockImplementation(() => {
        throw new Error('Invalid private key')
      })

      const { result } = renderHook(() =>
        useDeriveAddresses(invalidPrivateKey, false)
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(Logger.info).toHaveBeenCalledWith(
        'error deriving addresses:',
        expect.any(Error)
      )
      expect(result.current.derivedAddresses).toEqual([])
      expect(result.current.tempAccountDetails).toBeNull()
      expect(result.current.showDerivedInfo).toBe(false)
    })
  })

  describe('with empty private key', () => {
    it('should not show derived info and reset state', () => {
      const { result } = renderHook(() =>
        useDeriveAddresses(emptyPrivateKey, false)
      )

      // These are synchronous updates, no need to wait
      expect(result.current.derivedAddresses).toEqual([])
      expect(result.current.tempAccountDetails).toBeNull()
      expect(result.current.showDerivedInfo).toBe(false)

      const {
        deriveAllAddressesFromPrivateKey
      } = require('react-native-nitro-avalabs-crypto')
      expect(deriveAllAddressesFromPrivateKey).not.toHaveBeenCalled()
    })

    it('should not show derived info for whitespace-only private key', () => {
      const whitespacePrivateKey = '   '

      const { result } = renderHook(() =>
        useDeriveAddresses(whitespacePrivateKey, false)
      )

      expect(result.current.derivedAddresses).toEqual([])
      expect(result.current.tempAccountDetails).toBeNull()
      expect(result.current.showDerivedInfo).toBe(false)
    })
  })

  describe('state updates on prop changes', () => {
    it('should update when private key changes', async () => {
      const { result, rerender } = renderHook(
        ({ privateKey, isTestnet }) =>
          useDeriveAddresses(privateKey, isTestnet),
        {
          initialProps: {
            privateKey: emptyPrivateKey,
            isTestnet: false
          }
        }
      )

      // Initially empty (synchronous)
      expect(result.current.showDerivedInfo).toBe(false)

      // Update with valid private key
      act(() => {
        rerender({
          privateKey: validPrivateKey,
          isTestnet: false
        })
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.showDerivedInfo).toBe(true)
      expect(result.current.derivedAddresses).toHaveLength(2)

      // Update back to empty (synchronous)
      act(() => {
        rerender({
          privateKey: emptyPrivateKey,
          isTestnet: false
        })
      })

      expect(result.current.showDerivedInfo).toBe(false)
      expect(result.current.derivedAddresses).toEqual([])
      expect(result.current.tempAccountDetails).toBeNull()
    })

    it('should update when network changes', async () => {
      const { rerender } = renderHook(
        ({ privateKey, isTestnet }) =>
          useDeriveAddresses(privateKey, isTestnet),
        {
          initialProps: {
            privateKey: validPrivateKey,
            isTestnet: false
          }
        }
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const {
        deriveAllAddressesFromPrivateKey
      } = require('react-native-nitro-avalabs-crypto')

      // First call should be for mainnet
      expect(deriveAllAddressesFromPrivateKey).toHaveBeenCalledWith(
        validPrivateKey,
        false
      )

      // Clear previous calls
      deriveAllAddressesFromPrivateKey.mockClear()

      // Update to testnet
      act(() => {
        rerender({
          privateKey: validPrivateKey,
          isTestnet: true
        })
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Should now be called with testnet
      expect(deriveAllAddressesFromPrivateKey).toHaveBeenCalledWith(
        validPrivateKey,
        true
      )
    })
  })

  describe('edge cases', () => {
    it('should handle exactly 64 character private key', async () => {
      const exactly64CharKey = 'a'.repeat(64)
      const { strip0x } = require('@avalabs/core-utils-sdk')
      strip0x.mockReturnValue(exactly64CharKey)

      const { result } = renderHook(() =>
        useDeriveAddresses(exactly64CharKey, false)
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.derivedAddresses).toHaveLength(2)
      expect(result.current.tempAccountDetails).not.toBeNull()
    })

    it('should not derive addresses for 63 character private key', async () => {
      const shortKey = 'a'.repeat(63)
      const { strip0x } = require('@avalabs/core-utils-sdk')
      strip0x.mockReturnValue(shortKey)

      const { result } = renderHook(() => useDeriveAddresses(shortKey, false))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.derivedAddresses).toEqual([])
      expect(result.current.tempAccountDetails).toBeNull()
    })

    it('should not derive addresses for 65 character private key', async () => {
      const longKey = 'a'.repeat(65)
      const { strip0x } = require('@avalabs/core-utils-sdk')
      strip0x.mockReturnValue(longKey)

      const { result } = renderHook(() => useDeriveAddresses(longKey, false))

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(result.current.derivedAddresses).toEqual([])
      expect(result.current.tempAccountDetails).toBeNull()
    })
  })

  describe('temp account details structure', () => {
    it('should create correct temp account structure', async () => {
      const { result } = renderHook(() =>
        useDeriveAddresses(validPrivateKey, false)
      )

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const tempAccount = result.current.tempAccountDetails

      expect(tempAccount).toMatchObject({
        id: expect.any(String),
        index: 0,
        name: 'Account 1',
        type: CoreAccountType.IMPORTED,
        walletId: CORE_MOBILE_WALLET_ID,
        addressC: expect.any(String),
        addressBTC: expect.any(String),
        addressAVM: expect.any(String),
        addressPVM: expect.any(String),
        addressCoreEth: expect.any(String),
        addressSVM: expect.any(String)
      })

      // EVM hex (addressC) and Avalanche bech32 (addressCoreEth) are
      // different encodings of the same secp256k1 pubkey — `0x…` vs
      // `C-{bech32}` — so they should NOT be equal.
      expect(tempAccount?.addressC).not.toBe(tempAccount?.addressCoreEth)
      expect(tempAccount?.addressCoreEth).toMatch(/^C-/)
    })
  })
})
