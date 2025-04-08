import { Contact } from 'store/addressBook'
import { AddressType } from '../consts'
import { constructContactByAddressType } from './constructContactByAddressType'

// write test for constructContactByAddressType function
describe('constructContactByAddressType', () => {
  const contact: Contact = {
    id: '1',
    name: 'John Doe',
    addressC: '',
    addressPVM: '',
    addressAVM: '',
    addressEVM: '',
    addressBTC: ''
  }

  it('should construct contact with CChain address', () => {
    const result = constructContactByAddressType(
      contact,
      AddressType.CChain,
      'CChainAddress'
    )
    expect(result).toEqual({ ...contact, addressC: 'CChainAddress' })
  })

  it('should construct contact with PVM address', () => {
    const result = constructContactByAddressType(
      contact,
      AddressType.PVM,
      'PVMAddress'
    )
    expect(result).toEqual({ ...contact, addressPVM: 'PVMAddress' })
  })

  it('should construct contact with AVM address', () => {
    const result = constructContactByAddressType(
      contact,
      AddressType.AVM,
      'AVMAddress'
    )
    expect(result).toEqual({ ...contact, addressAVM: 'AVMAddress' })
  })

  it('should construct contact with EVM address', () => {
    const result = constructContactByAddressType(
      contact,
      AddressType.EVM,
      'EVMAddress'
    )
    expect(result).toEqual({ ...contact, addressEVM: 'EVMAddress' })
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
