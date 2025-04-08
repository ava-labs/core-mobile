import { AddressType } from '../consts'
import { isValidAddress } from './isValidAddress'

const XP_ADDRESS = 'avax1k6rjd2j3m0jatw7ef9f3rrf754eq6mgqxuep3p'
const XP_ADDRESS_TESTNET = 'fuji1q7q6rx3x5jtlfm9rr0t4zue88fgcah09mlg6m7'
const C_ADDRESS = '0x1234567890123456789012345678901234567890'
const BTC_ADDRESS = '1Fh7ajXabJBpZPZw8bjD3QU4CuQ3pRty9u'
const BTC_ADDRESS_TESTNET = 'tb1q0hchrw5nnru09292jz67zhzrq56tapgaftw7ps'

describe('isValidAddress', () => {
  it('should return true for valid CChain address', () => {
    expect(isValidAddress(AddressType.CChain, C_ADDRESS)).toBe(true)
  })

  it('should return false for invalid CChain address', () => {
    expect(isValidAddress(AddressType.CChain, 'invalidCChainAddress')).toBe(
      false
    )
  })

  it('should return true for valid EVM address', () => {
    expect(isValidAddress(AddressType.EVM, C_ADDRESS)).toBe(true)
  })

  it('should return false for invalid EVM address', () => {
    expect(isValidAddress(AddressType.EVM, 'invalidEVMAddress')).toBe(false)
  })

  it('should return true for valid PVM address in developer mode', () => {
    expect(isValidAddress(AddressType.PVM, XP_ADDRESS_TESTNET, true)).toBe(true)
  })
  it('should return false for invalid PVM address in developer mode', () => {
    expect(isValidAddress(AddressType.PVM, 'invalidPVMAddress', true)).toBe(
      false
    )
  })
  it('should return true for valid PVM address in production mode', () => {
    expect(isValidAddress(AddressType.PVM, XP_ADDRESS)).toBe(true)
  })
  it('should return false for invalid PVM address in production mode', () => {
    expect(isValidAddress(AddressType.PVM, 'invalidPVMAddress')).toBe(false)
  })

  it('should return true for valid AVM address in developer mode', () => {
    expect(isValidAddress(AddressType.AVM, XP_ADDRESS_TESTNET, true)).toBe(true)
  })
  it('should return false for invalid AVM address in developer mode', () => {
    expect(isValidAddress(AddressType.AVM, 'invalidPVMAddress', true)).toBe(
      false
    )
  })
  it('should return true for valid AVM address in production mode', () => {
    expect(isValidAddress(AddressType.AVM, XP_ADDRESS)).toBe(true)
  })
  it('should return false for invalid AVM address in production mode', () => {
    expect(isValidAddress(AddressType.AVM, 'invalidPVMAddress')).toBe(false)
  })

  it('should return true for valid BTC address in developer mode', () => {
    expect(isValidAddress(AddressType.BTC, BTC_ADDRESS_TESTNET, true)).toBe(
      true
    )
  })

  it('should return false for invalid BTC address in developer mode', () => {
    expect(isValidAddress(AddressType.BTC, 'invalidBTCAddress', true)).toBe(
      false
    )
  })
  it('should return true for valid BTC address in production mode', () => {
    expect(isValidAddress(AddressType.BTC, BTC_ADDRESS)).toBe(true)
  })
  it('should return false for invalid BTC address in production mode', () => {
    expect(isValidAddress(AddressType.BTC, 'invalidBTCAddress')).toBe(false)
  })
})
