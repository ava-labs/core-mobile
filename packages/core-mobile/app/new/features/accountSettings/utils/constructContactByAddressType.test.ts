import { Contact } from 'store/addressBook'
import { AddressType } from '../consts'
import { constructContactByAddressType } from './constructContactByAddressType'

// write test for constructContactByAddressType function
describe('constructContactByAddressType', () => {
  let contact: Contact = {
    id: '1',
    name: 'John Doe',
    addressC: undefined,
    addressPVM: undefined,
    addressAVM: undefined,
    addressEVM: undefined,
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
      addressC: '0xAddress',
      addressEVM: '0xAddress'
    })
  })

  it('should construct contact with EVM address', () => {
    const result = constructContactByAddressType(
      contact,
      AddressType.EVM,
      '0xAddress'
    )
    expect(result).toEqual({
      ...contact,
      addressC: '0xAddress',
      addressEVM: '0xAddress'
    })
  })

  it('should construct contact with only CChain address', () => {
    contact = {
      ...contact,
      addressEVM: 'existingEVMAddress'
    }
    const result = constructContactByAddressType(
      contact,
      AddressType.CChain,
      '0xAddress'
    )
    expect(result).toEqual({
      ...contact,
      addressC: '0xAddress',
      addressEVM: 'existingEVMAddress'
    })
  })

  it('should construct contact with only EVM address', () => {
    contact = {
      ...contact,
      addressC: 'existingAddressC'
    }
    const result = constructContactByAddressType(
      contact,
      AddressType.EVM,
      '0xAddress'
    )
    expect(result).toEqual({
      ...contact,
      addressC: 'existingAddressC',
      addressEVM: '0xAddress'
    })
  })

  it('should construct contact with PVM address', () => {
    const result = constructContactByAddressType(
      contact,
      AddressType.PVM,
      'xpAddress'
    )
    expect(result).toEqual({
      ...contact,
      addressPVM: 'P-xpAddress',
      addressAVM: 'X-xpAddress'
    })
  })

  it('should construct contact with AVM address', () => {
    const result = constructContactByAddressType(
      contact,
      AddressType.AVM,
      'xpAddress'
    )
    expect(result).toEqual({
      ...contact,
      addressPVM: 'P-xpAddress',
      addressAVM: 'X-xpAddress'
    })
  })

  it('should construct contact with only PVM address', () => {
    contact = {
      ...contact,
      addressAVM: 'X-existingAddressAVM'
    }
    const result = constructContactByAddressType(
      contact,
      AddressType.PVM,
      'xpAddress'
    )
    expect(result).toEqual({
      ...contact,
      addressPVM: 'P-xpAddress',
      addressAVM: 'X-existingAddressAVM'
    })
  })

  it('should construct contact with only AVM address', () => {
    contact = {
      ...contact,
      addressPVM: 'P-existingAddressPVM'
    }
    const result = constructContactByAddressType(
      contact,
      AddressType.AVM,
      'xpAddress'
    )
    expect(result).toEqual({
      ...contact,
      addressPVM: 'P-existingAddressPVM',
      addressAVM: 'X-xpAddress'
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
