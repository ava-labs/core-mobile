import { Contact } from 'store/addressBook'
import { AddressType } from '../consts'
import { constructContactByAddressType } from './constructContactByAddressType'

// write test for constructContactByAddressType function
describe('constructContactByAddressType', () => {
  const contact: Contact = {
    id: '1',
    name: 'John Doe',
    type: 'contact',
    address: undefined,
    addressXP: undefined,
    addressBTC: undefined
  }

  describe('adding addresses', () => {
    it('should construct contact with CChain address', () => {
      const result = constructContactByAddressType(
        contact,
        AddressType.EVM,
        '0xAddress'
      )
      expect(result).toEqual({
        ...contact,
        address: '0xAddress'
      })
    })

    it('should construct contact with XP address', () => {
      const result = constructContactByAddressType(
        contact,
        AddressType.XP,
        'xpAddress'
      )
      expect(result).toEqual({
        ...contact,
        addressXP: 'xpAddress'
      })
    })

    it('should construct contact with BTC address', () => {
      const result = constructContactByAddressType(
        contact,
        AddressType.BTC,
        'BTCAddress'
      )
      expect(result).toEqual({ ...contact, addressBTC: 'BTCAddress' })
    })

    it('should construct contact with Solana address', () => {
      const result = constructContactByAddressType(
        contact,
        AddressType.SOLANA,
        'SolanaAddress'
      )
      expect(result).toEqual({ ...contact, addressSVM: 'SolanaAddress' })
    })
  })

  describe('deleting addresses', () => {
    const contactWithAddresses: Contact = {
      id: '1',
      name: 'John Doe',
      type: 'contact',
      address: '0xExistingAddress',
      addressXP: 'existingXPAddress',
      addressBTC: 'existingBTCAddress',
      addressSVM: 'existingSolanaAddress'
    }

    it('should delete CChain address when value is undefined', () => {
      const result = constructContactByAddressType(
        contactWithAddresses,
        AddressType.EVM,
        undefined
      )
      expect(result).toEqual({
        ...contactWithAddresses,
        address: undefined
      })
    })

    it('should delete XP address when value is undefined', () => {
      const result = constructContactByAddressType(
        contactWithAddresses,
        AddressType.XP,
        undefined
      )
      expect(result).toEqual({
        ...contactWithAddresses,
        addressXP: undefined
      })
    })

    it('should delete BTC address when value is undefined', () => {
      const result = constructContactByAddressType(
        contactWithAddresses,
        AddressType.BTC,
        undefined
      )
      expect(result).toEqual({
        ...contactWithAddresses,
        addressBTC: undefined
      })
    })

    it('should delete Solana address when value is undefined', () => {
      const result = constructContactByAddressType(
        contactWithAddresses,
        AddressType.SOLANA,
        undefined
      )
      expect(result).toEqual({
        ...contactWithAddresses,
        addressSVM: undefined
      })
    })

    it('should result in contact with no addresses when deleting last address', () => {
      const contactWithOneAddress: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: '0xOnlyAddress',
        addressXP: undefined,
        addressBTC: undefined,
        addressSVM: undefined
      }

      const result = constructContactByAddressType(
        contactWithOneAddress,
        AddressType.EVM,
        undefined
      )

      expect(result.address).toBeUndefined()
      expect(result.addressXP).toBeUndefined()
      expect(result.addressBTC).toBeUndefined()
      expect(result.addressSVM).toBeUndefined()
    })
  })

  describe('testnet address types', () => {
    it('should handle EVM testnet address type', () => {
      const result = constructContactByAddressType(
        contact,
        AddressType.EVM_TESTNET,
        '0xTestnetAddress'
      )
      expect(result).toEqual({
        ...contact,
        address: '0xTestnetAddress'
      })
    })

    it('should handle XP testnet address type', () => {
      const result = constructContactByAddressType(
        contact,
        AddressType.XP_TESTNET,
        'xpTestnetAddress'
      )
      expect(result).toEqual({
        ...contact,
        addressXP: 'xpTestnetAddress'
      })
    })

    it('should handle BTC testnet address type', () => {
      const result = constructContactByAddressType(
        contact,
        AddressType.BTC_TESTNET,
        'BTCTestnetAddress'
      )
      expect(result).toEqual({ ...contact, addressBTC: 'BTCTestnetAddress' })
    })

    it('should handle Solana devnet address type', () => {
      const result = constructContactByAddressType(
        contact,
        AddressType.SOLANA_DEVNET,
        'SolanaDevnetAddress'
      )
      expect(result).toEqual({ ...contact, addressSVM: 'SolanaDevnetAddress' })
    })
  })
})
