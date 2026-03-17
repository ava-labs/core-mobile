import { Contact } from 'store/addressBook'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { getMatchingAddress } from './getMatchingAddress'

jest.mock('features/accountSettings/utils/isValidAddressByVmName', () => ({
  isValidAddressByVmName: ({
    vmName,
    address
  }: {
    vmName?: string
    address: string
  }) => {
    if (vmName === undefined) return true
    if (vmName === 'EVM') return address.startsWith('0x')
    if (vmName === 'SVM') return !address.startsWith('0x')
    return false
  }
}))

const makeContact = (overrides: Partial<Contact>): Contact =>
  ({
    id: '1',
    name: 'Test',
    type: 'contact',
    ...overrides
  } as Contact)

describe('getMatchingAddress', () => {
  const evmAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const solanaAddress = '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV'
  const xpAddress = 'avax1k6rjd2j3m0jatw7ef9f3rrf754eq6mgqxuep3p'
  const btcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

  const multiChainContact = makeContact({
    address: evmAddress,
    addressSVM: solanaAddress,
    addressXP: xpAddress,
    addressBTC: btcAddress
  })

  describe('with active search text', () => {
    it('should return Solana address when search matches addressSVM', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: solanaAddress,
        vmName: undefined,
        isDeveloperMode: false
      })
      expect(result).toBe(solanaAddress)
    })

    it('should return EVM address when search matches address', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: evmAddress,
        vmName: undefined,
        isDeveloperMode: false
      })
      expect(result).toBe(evmAddress)
    })

    it('should return XP address when search matches addressXP', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: xpAddress,
        vmName: undefined,
        isDeveloperMode: false
      })
      expect(result).toBe(xpAddress)
    })

    it('should return BTC address when search matches addressBTC', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: btcAddress,
        vmName: undefined,
        isDeveloperMode: false
      })
      expect(result).toBe(btcAddress)
    })

    it('should be case-insensitive when matching search text', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: solanaAddress.toUpperCase(),
        vmName: undefined,
        isDeveloperMode: false
      })
      expect(result).toBe(solanaAddress)
    })

    it('should match by partial address', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: '7EcDh',
        vmName: undefined,
        isDeveloperMode: false
      })
      expect(result).toBe(solanaAddress)
    })

    it('should fall back to getAddressByVmName when search matches name but not any address', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: 'Test',
        vmName: NetworkVMType.SVM,
        isDeveloperMode: false
      })
      expect(result).toBe(solanaAddress)
    })
  })

  describe('without search text (recents)', () => {
    it('should return EVM address when vmName is EVM', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: '',
        vmName: NetworkVMType.EVM,
        isDeveloperMode: false
      })
      expect(result).toBe(evmAddress)
    })

    it('should return Solana address when vmName is SVM', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: '',
        vmName: NetworkVMType.SVM,
        isDeveloperMode: false
      })
      expect(result).toBe(solanaAddress)
    })

    it('should return first valid address when vmName is undefined', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: '',
        vmName: undefined,
        isDeveloperMode: false
      })
      expect(result).toBe(evmAddress)
    })

    it('should handle whitespace-only search text as no search', () => {
      const result = getMatchingAddress({
        contact: multiChainContact,
        searchText: '   ',
        vmName: NetworkVMType.EVM,
        isDeveloperMode: false
      })
      expect(result).toBe(evmAddress)
    })
  })

  describe('edge cases', () => {
    it('should return undefined for contact with no addresses', () => {
      const emptyContact = makeContact({})
      const result = getMatchingAddress({
        contact: emptyContact,
        searchText: '',
        vmName: NetworkVMType.EVM,
        isDeveloperMode: false
      })
      expect(result).toBeUndefined()
    })

    it('should return Solana address for SVM-only contact', () => {
      const svmOnly = makeContact({ addressSVM: solanaAddress })
      const result = getMatchingAddress({
        contact: svmOnly,
        searchText: solanaAddress,
        vmName: undefined,
        isDeveloperMode: false
      })
      expect(result).toBe(solanaAddress)
    })
  })
})
