import { Contact } from 'store/addressBook'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { getAddressByVmName } from './getAddressByVmName'

describe('getAddressByVmName', () => {
  const contact = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    addressXP: 'avax1k6rjd2j3m0jatw7ef9f3rrf754eq6mgqxuep3p',
    addressBTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  }

  it('should return address for EVM', () => {
    const result = getAddressByVmName({
      contact: contact as Contact,
      vmName: NetworkVMType.EVM,
      isDeveloperMode: false
    })
    expect(result).toEqual(contact.address)
  })

  it('should return addressXP for PVM', () => {
    const result = getAddressByVmName({
      contact: contact as Contact,
      vmName: NetworkVMType.PVM,
      isDeveloperMode: false
    })
    expect(result).toEqual(contact.addressXP)
  })

  it('should return addressBTC for Bitcoin', () => {
    const result = getAddressByVmName({
      contact: contact as Contact,
      vmName: NetworkVMType.BITCOIN,
      isDeveloperMode: false
    })
    expect(result).toEqual(contact.addressBTC)
  })

  it('should return undefined for unsupported vmName', () => {
    const result = getAddressByVmName({
      contact: contact as Contact,
      vmName: NetworkVMType.SVM,
      isDeveloperMode: false
    })
    expect(result).toBeUndefined()
  })

  it('should return undefined for developer mode', () => {
    const result = getAddressByVmName({
      contact: contact as Contact,
      vmName: NetworkVMType.BITCOIN,
      isDeveloperMode: true
    })
    expect(result).toBeUndefined()
  })

  it('should return testnet address for developer mode', () => {
    const testnetP = {
      addressXP: 'fuji1q7q6rx3x5jtlfm9rr0t4zue88fgcah09mlg6m7'
    }
    const result = getAddressByVmName({
      contact: testnetP as Contact,
      vmName: NetworkVMType.PVM,
      isDeveloperMode: true
    })
    expect(result).toEqual(testnetP.addressXP)
  })
})
