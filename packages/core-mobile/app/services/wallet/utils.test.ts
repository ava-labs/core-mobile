import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  NetworkVMType,
  RpcMethod,
  TypedData,
  MessageTypes
} from '@avalabs/vm-module-types'
import { Network } from '@avalabs/core-chains-sdk'
import { SignTypedDataVersion } from '@metamask/eth-sig-util'
import { LedgerAppType, LEDGER_BLIND_SIGN_MESSAGE } from 'services/ledger/types'
import {
  addBufferToCChainBaseFee,
  getEvmTypedDataVersion,
  handleLedgerError
} from './utils'

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

describe('handleLedgerError', () => {
  const err = (msg: string): Error => new Error(msg)

  it('maps a bare 0x6984 from the Avalanche app to the blind-sign message', () => {
    expect(() =>
      handleLedgerError({
        error: err('Ledger device: UNKNOWN_ERROR (0x6984)'),
        appType: LedgerAppType.AVALANCHE
      })
    ).toThrow(LEDGER_BLIND_SIGN_MESSAGE)
  })

  it('does NOT apply the blind-sign message for 0x6984 on a non-Avalanche app', () => {
    expect(() =>
      handleLedgerError({
        error: err('Ledger device: UNKNOWN_ERROR (0x6984)'),
        appType: LedgerAppType.ETHEREUM
      })
    ).not.toThrow()
  })

  it('resolves an L1 network to the Avalanche app and maps 0x6984', () => {
    const l1Network = {
      vmName: NetworkVMType.EVM,
      subnetId: 'orange-subnet',
      chainId: 999999
    } as unknown as Network
    expect(() =>
      handleLedgerError({
        error: err('Ledger device: UNKNOWN_ERROR (0x6984)'),
        network: l1Network
      })
    ).toThrow(LEDGER_BLIND_SIGN_MESSAGE)
  })
})
