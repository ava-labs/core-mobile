import { ChainId } from '@avalabs/core-chains-sdk'
import { Contact } from 'store/addressBook'
import { getAddressByChainId } from './getAddressByChainId'

describe('getAddressByChainId', () => {
  const contact = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    addressXP: 'avax1k6rjd2j3m0jatw7ef9f3rrf754eq6mgqxuep3p',
    addressBTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  }

  it('should return address for mainnet chain ID', () => {
    const result = getAddressByChainId({
      contact: contact as Contact,
      chainId: ChainId.AVALANCHE_MAINNET_ID,
      isDeveloperMode: false
    })
    expect(result).toEqual(contact.address)
  })

  it('should return addressXP for Avalanche P chain', () => {
    const result = getAddressByChainId({
      contact: contact as Contact,
      chainId: ChainId.AVALANCHE_P,
      isDeveloperMode: false
    })
    expect(result).toEqual(contact.addressXP)
  })

  it('should return addressBTC for Bitcoin mainnet', () => {
    const result = getAddressByChainId({
      contact: contact as Contact,
      chainId: ChainId.BITCOIN,
      isDeveloperMode: false
    })
    expect(result).toEqual(contact.addressBTC)
  })

  it('should return undefined for unsupported chain ID', () => {
    const result = getAddressByChainId({
      contact: contact as Contact,
      chainId: ChainId.DFK,
      isDeveloperMode: false
    })
    expect(result).toBeUndefined()
  })

  it('should return undefined for developer mode with testnet chain ID', () => {
    const result = getAddressByChainId({
      contact: contact as Contact,
      chainId: ChainId.BITCOIN_TESTNET,
      isDeveloperMode: true
    })
    expect(result).toBeUndefined()
  })

  it('should return testnet address for developer mode with testnet chain ID', () => {
    const testnetP = {
      addressXP: 'fuji1q7q6rx3x5jtlfm9rr0t4zue88fgcah09mlg6m7'
    }
    const result = getAddressByChainId({
      contact: testnetP as Contact,
      chainId: ChainId.AVALANCHE_TEST_P,
      isDeveloperMode: true
    })
    expect(result).toEqual(testnetP.addressXP)
  })
})
