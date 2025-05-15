import { AddressType } from '../consts'
import { isValidAddress } from './isValidAddress'

const XP_ADDRESS = 'avax1k6rjd2j3m0jatw7ef9f3rrf754eq6mgqxuep3p'
const XP_ADDRESS_TESTNET = 'fuji1q7q6rx3x5jtlfm9rr0t4zue88fgcah09mlg6m7'
const C_ADDRESS = '0x1234567890123456789012345678901234567890'
const BTC_ADDRESS = '1Fh7ajXabJBpZPZw8bjD3QU4CuQ3pRty9u'
const BTC_ADDRESS_TESTNET = 'tb1q0hchrw5nnru09292jz67zhzrq56tapgaftw7ps'

describe('isValidAddress', () => {
  it('should return true for valid CChain address', () => {
    expect(
      isValidAddress({
        addressType: AddressType.EVM,
        address: C_ADDRESS,
        isDeveloperMode: false
      })
    ).toBe(true)
  })

  it('should return false for invalid CChain address', () => {
    expect(
      isValidAddress({
        addressType: AddressType.EVM,
        address: 'invalidCChainAddress',
        isDeveloperMode: false
      })
    ).toBe(false)
  })

  it('should return true for valid X/P address in developer mode', () => {
    expect(
      isValidAddress({
        addressType: AddressType.XP,
        address: XP_ADDRESS_TESTNET,
        isDeveloperMode: true
      })
    ).toBe(true)
  })
  it('should return false for invalid X/P address in developer mode', () => {
    expect(
      isValidAddress({
        addressType: AddressType.XP,
        address: 'invalidXPAddress',
        isDeveloperMode: true
      })
    ).toBe(false)
  })

  it('should return true for valid X/P address in production mode', () => {
    expect(
      isValidAddress({
        addressType: AddressType.XP,
        address: XP_ADDRESS,
        isDeveloperMode: false
      })
    ).toBe(true)
  })
  it('should return false for invalid X/P address in production mode', () => {
    expect(
      isValidAddress({
        addressType: AddressType.XP,
        address: 'invalidXPVMAddress',
        isDeveloperMode: false
      })
    ).toBe(false)
  })
  it('should return true for valid BTC address in developer mode', () => {
    expect(
      isValidAddress({
        addressType: AddressType.BTC,
        address: BTC_ADDRESS_TESTNET,
        isDeveloperMode: true
      })
    ).toBe(true)
  })

  it('should return false for invalid BTC address in developer mode', () => {
    expect(
      isValidAddress({
        addressType: AddressType.BTC,
        address: 'invalidBTCAddress',
        isDeveloperMode: true
      })
    ).toBe(false)
  })
  it('should return true for valid BTC address in production mode', () => {
    expect(
      isValidAddress({
        addressType: AddressType.BTC,
        address: BTC_ADDRESS,
        isDeveloperMode: false
      })
    ).toBe(true)
  })
  it('should return false for invalid BTC address in production mode', () => {
    expect(
      isValidAddress({
        addressType: AddressType.BTC,
        address: 'invalidBTCAddress',
        isDeveloperMode: false
      })
    ).toBe(false)
  })
})
