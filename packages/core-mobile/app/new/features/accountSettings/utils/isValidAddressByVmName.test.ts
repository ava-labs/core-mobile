import { NetworkVMType } from '@avalabs/vm-module-types'
import { isValidAddressByVmName } from './isValidAddressByVmName'

const XP_ADDRESS = 'avax1k6rjd2j3m0jatw7ef9f3rrf754eq6mgqxuep3p'
const XP_ADDRESS_TESTNET = 'fuji1q7q6rx3x5jtlfm9rr0t4zue88fgcah09mlg6m7'
const C_ADDRESS = '0x1234567890123456789012345678901234567890'
const BTC_ADDRESS = '1Fh7ajXabJBpZPZw8bjD3QU4CuQ3pRty9u'
const BTC_ADDRESS_TESTNET = 'tb1q0hchrw5nnru09292jz67zhzrq56tapgaftw7ps'

describe('isValidAddressByVmName', () => {
  it('should return true for valid CChain address', () => {
    expect(
      isValidAddressByVmName({
        address: C_ADDRESS,
        vmName: NetworkVMType.EVM,
        isDeveloperMode: false
      })
    ).toBe(true)
  })

  it('should return false for invalid CChain address', () => {
    expect(
      isValidAddressByVmName({
        address: 'invalidCChainAddress',
        vmName: NetworkVMType.EVM,
        isDeveloperMode: false
      })
    ).toBe(false)
  })

  it('should return true for valid X/P address', () => {
    expect(
      isValidAddressByVmName({
        address: XP_ADDRESS,
        vmName: NetworkVMType.PVM,
        isDeveloperMode: false
      })
    ).toBe(true)
  })

  it('should return true for valid X/P address in developer mode', () => {
    expect(
      isValidAddressByVmName({
        address: XP_ADDRESS_TESTNET,
        vmName: NetworkVMType.PVM,
        isDeveloperMode: true
      })
    ).toBe(true)
  })

  it('should return true for valid bitcoin address', () => {
    expect(
      isValidAddressByVmName({
        address: BTC_ADDRESS,
        vmName: NetworkVMType.BITCOIN,
        isDeveloperMode: false
      })
    ).toBe(true)
  })

  it('should return true for valid bitcoin address in developer mode', () => {
    expect(
      isValidAddressByVmName({
        address: BTC_ADDRESS_TESTNET,
        vmName: NetworkVMType.BITCOIN,
        isDeveloperMode: true
      })
    ).toBe(true)
  })
})
