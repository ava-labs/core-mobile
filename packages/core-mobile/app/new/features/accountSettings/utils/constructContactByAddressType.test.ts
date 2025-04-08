import { Contact } from 'store/addressBook'
import { AddressType } from '../consts'
import { constructContactByAddressType } from './constructContactByAddressType'

// write test for constructContactByAddressType function
describe('constructContactByAddressType', () => {
  const contact: Contact = {
    id: '1',
    name: 'John Doe',
    address: undefined,
    addressXP: undefined,
    addressBTC: undefined
  }

  it('should construct contact with CChain address', () => {
    const result = constructContactByAddressType(
      contact,
      AddressType.CChain,
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
})
