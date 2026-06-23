import { TokenUnit } from '@avalabs/core-utils-sdk'
import { RpcMethod, TypedData, MessageTypes } from '@avalabs/vm-module-types'
import { SignTypedDataVersion } from '@metamask/eth-sig-util'
import { addBufferToCChainBaseFee, getEvmTypedDataVersion } from './utils'

describe('addBufferToCChainBaseFee', () => {
  it('should increase base fee by 20%', async () => {
    const baseFee = new TokenUnit(1_000_000_000, 18, 'AVAX')
    const instantFee = addBufferToCChainBaseFee(baseFee, 0.2)
    expect(instantFee.eq(new TokenUnit(1_200_000_000, 18, 'AVAX'))).toBe(true)
  })

  it('should increase base fee by 150%', async () => {
    const baseFee = new TokenUnit(1_000_000_000, 18, 'AVAX')
    const instantFee = addBufferToCChainBaseFee(baseFee, 1.5)
    expect(instantFee.eq(new TokenUnit(2_500_000_000, 18, 'AVAX'))).toBe(true)
  })

  it('should enforce a minimum base fee of 1 nano AVAX', async () => {
    const baseFee = new TokenUnit(1, 18, 'AVAX')
    const instantFee = addBufferToCChainBaseFee(baseFee, 1.5)
    expect(instantFee.eq(new TokenUnit(1_000_000_000, 18, 'AVAX'))).toBe(true)
  })
})

describe('getEvmTypedDataVersion', () => {
  const TYPED_DATA_V4: TypedData<MessageTypes> = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' }
      ],
      Person: [{ name: 'wallet', type: 'address' }]
    },
    primaryType: 'Person',
    domain: { name: 'Test', chainId: 1 },
    message: { wallet: '0x0000000000000000000000000000000000000000' }
  }

  // legacy eth_signTypedData_v1 payload shape (array of typed values)
  const TYPED_DATA_V1 = [{ type: 'string', name: 'msg', value: 'hi' }]

  it('maps SIGN_TYPED_DATA_V3 to V3 regardless of payload shape', () => {
    expect(
      getEvmTypedDataVersion(RpcMethod.SIGN_TYPED_DATA_V3, TYPED_DATA_V4)
    ).toBe(SignTypedDataVersion.V3)
  })

  it('maps SIGN_TYPED_DATA_V4 to V4', () => {
    expect(
      getEvmTypedDataVersion(RpcMethod.SIGN_TYPED_DATA_V4, TYPED_DATA_V4)
    ).toBe(SignTypedDataVersion.V4)
  })

  it('treats eth_signTypedData carrying a V4 payload as V4', () => {
    expect(
      getEvmTypedDataVersion(RpcMethod.SIGN_TYPED_DATA, TYPED_DATA_V4)
    ).toBe(SignTypedDataVersion.V4)
  })

  it('treats a legacy eth_signTypedData_v1 payload as V1', () => {
    expect(
      getEvmTypedDataVersion(RpcMethod.SIGN_TYPED_DATA_V1, TYPED_DATA_V1)
    ).toBe(SignTypedDataVersion.V1)
  })
})
