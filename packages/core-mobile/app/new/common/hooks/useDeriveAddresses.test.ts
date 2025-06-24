import { renderHook, act } from '@testing-library/react-hooks'
import { networks } from 'bitcoinjs-lib'
import { CoreAccountType } from '@avalabs/types'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import { useDeriveAddresses } from './useDeriveAddresses'

// Mock the core-wallets-sdk functions
jest.mock('@avalabs/core-wallets-sdk', () => ({
  getBtcAddressFromPubKey: jest.fn(),
  getEvmAddressFromPubKey: jest.fn(),
  getPublicKeyFromPrivateKey: jest.fn()
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
  const mockPublicKey = 'mock-public-key'
  const mockEvmAddress = '0x1234567890123456789012345678901234567890'
  const mockBtcAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  const mockUuid = 'mock-uuid-1234'
  const validPrivateKey =
    'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  const invalidPrivateKey = 'invalid-key'
  const emptyPrivateKey = ''

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    const {
      getBtcAddressFromPubKey,
      getEvmAddressFromPubKey,
      getPublicKeyFromPrivateKey
    } = require('@avalabs/core-wallets-sdk')

    const { strip0x } = require('@avalabs/core-utils-sdk')
    const { uuid } = require('utils/uuid')

    strip0x.mockImplementation((key: string) => key.replace('0x', ''))
    getPublicKeyFromPrivateKey.mockReturnValue(mockPublicKey)
    getEvmAddressFromPubKey.mockReturnValue(mockEvmAddress)
    getBtcAddressFromPubKey.mockReturnValue(mockBtcAddress)
    uuid.mockReturnValue(mockUuid)
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
        getBtcAddressFromPubKey,
        getEvmAddressFromPubKey,
        getPublicKeyFromPrivateKey
      } = require('@avalabs/core-wallets-sdk')

      expect(getPublicKeyFromPrivateKey).toHaveBeenCalledWith(validPrivateKey)
      expect(getEvmAddressFromPubKey).toHaveBeenCalledWith(mockPublicKey)
      expect(getBtcAddressFromPubKey).toHaveBeenCalledWith(
        mockPublicKey,
        networks.bitcoin
      )

      expect(result.current.derivedAddresses).toEqual([
        { address: mockEvmAddress, symbol: 'AVAX' },
        { address: mockBtcAddress, symbol: 'BTC' }
      ])

      expect(result.current.tempAccountDetails).toEqual({
        id: mockUuid,
        index: 0,
        name: 'Imported Key',
        type: CoreAccountType.IMPORTED,
        walletId: CORE_MOBILE_WALLET_ID,
        addressC: mockEvmAddress,
        addressBTC: mockBtcAddress,
        addressAVM: '',
        addressPVM: '',
        addressCoreEth: mockEvmAddress
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

      const { getBtcAddressFromPubKey } = require('@avalabs/core-wallets-sdk')

      expect(getBtcAddressFromPubKey).toHaveBeenCalledWith(
        mockPublicKey,
        networks.testnet
      )

      expect(result.current.derivedAddresses).toEqual([
        { address: mockEvmAddress, symbol: 'AVAX' },
        { address: mockBtcAddress, symbol: 'BTC' }
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
      expect(result.current.showDerivedInfo).toBe(true) // Still true because privateKey is not empty
    })

    it('should handle derivation errors gracefully', async () => {
      const {
        getPublicKeyFromPrivateKey
      } = require('@avalabs/core-wallets-sdk')
      const Logger = require('utils/Logger')

      // Mock function to throw an error
      getPublicKeyFromPrivateKey.mockImplementation(() => {
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
      expect(result.current.showDerivedInfo).toBe(true)
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
        getPublicKeyFromPrivateKey
      } = require('@avalabs/core-wallets-sdk')
      expect(getPublicKeyFromPrivateKey).not.toHaveBeenCalled()
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

      const { getBtcAddressFromPubKey } = require('@avalabs/core-wallets-sdk')

      // First call should be for mainnet
      expect(getBtcAddressFromPubKey).toHaveBeenCalledWith(
        mockPublicKey,
        networks.bitcoin
      )

      // Clear previous calls
      getBtcAddressFromPubKey.mockClear()

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
      expect(getBtcAddressFromPubKey).toHaveBeenCalledWith(
        mockPublicKey,
        networks.testnet
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
        name: 'Imported Key',
        type: CoreAccountType.IMPORTED,
        walletId: CORE_MOBILE_WALLET_ID,
        addressC: expect.any(String),
        addressBTC: expect.any(String),
        addressAVM: '',
        addressPVM: '',
        addressCoreEth: expect.any(String)
      })

      // addressC and addressCoreEth should be the same
      expect(tempAccount?.addressC).toBe(tempAccount?.addressCoreEth)
    })
  })
})
