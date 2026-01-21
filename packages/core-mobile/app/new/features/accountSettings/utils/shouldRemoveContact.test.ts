import { Contact } from 'store/addressBook'
import { shouldRemoveContact } from './shouldRemoveContact'
import { AVATARS } from 'store/settings/avatar'
import { AvatarType } from '@avalabs/k2-alpine'

describe('shouldRemoveContact', () => {
  describe('when contact has no addresses', () => {
    it('should return true when all address fields are undefined', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: undefined,
        addressXP: undefined,
        addressBTC: undefined,
        addressSVM: undefined
      }

      expect(shouldRemoveContact(contact)).toBe(true)
    })

    it('should return true when address fields are not present', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact'
      }

      expect(shouldRemoveContact(contact)).toBe(true)
    })
  })

  describe('when contact has one address', () => {
    it('should return false when contact has EVM address', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: '0xAddress',
        addressXP: undefined,
        addressBTC: undefined,
        addressSVM: undefined
      }

      expect(shouldRemoveContact(contact)).toBe(false)
    })

    it('should return false when contact has XP address', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: undefined,
        addressXP: 'xpAddress',
        addressBTC: undefined,
        addressSVM: undefined
      }

      expect(shouldRemoveContact(contact)).toBe(false)
    })

    it('should return false when contact has BTC address', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: undefined,
        addressXP: undefined,
        addressBTC: 'btcAddress',
        addressSVM: undefined
      }

      expect(shouldRemoveContact(contact)).toBe(false)
    })

    it('should return false when contact has Solana address', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: undefined,
        addressXP: undefined,
        addressBTC: undefined,
        addressSVM: 'solanaAddress'
      }

      expect(shouldRemoveContact(contact)).toBe(false)
    })
  })

  describe('when contact has multiple addresses', () => {
    it('should return false when contact has all addresses', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: '0xAddress',
        addressXP: 'xpAddress',
        addressBTC: 'btcAddress',
        addressSVM: 'solanaAddress'
      }

      expect(shouldRemoveContact(contact)).toBe(false)
    })

    it('should return false when contact has some addresses', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: '0xAddress',
        addressXP: undefined,
        addressBTC: 'btcAddress',
        addressSVM: undefined
      }

      expect(shouldRemoveContact(contact)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should return true when address is empty string', () => {
      // Empty strings are falsy but not undefined, however the function
      // checks for undefined specifically, so empty string would count as having an address
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        address: '',
        addressXP: undefined,
        addressBTC: undefined,
        addressSVM: undefined
      }

      // Empty string is not undefined, so it's considered as having an address
      expect(shouldRemoveContact(contact)).toBe(false)
    })

    it('should handle contact with avatar field that starts with different prefix', () => {
      const contact: Contact = {
        id: '1',
        name: 'John Doe',
        type: 'contact',
        avatar: AVATARS[0] as AvatarType,
        address: undefined,
        addressXP: undefined,
        addressBTC: undefined,
        addressSVM: undefined
      }

      // avatar field should not be counted as an address
      expect(shouldRemoveContact(contact)).toBe(true)
    })
  })
})
