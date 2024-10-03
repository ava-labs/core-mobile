import { calculateCChainFee } from 'services/earn/calculateCrossChainFees'
import { avaxSerial, UnsignedTx } from '@avalabs/avalanchejs'
import { TokenUnit } from '@avalabs/core-utils-sdk'

describe('earn/calculateCChainFee', () => {
  describe('calculateCChainFee', () => {
    const unsignedTxMock = {
      getSignedTx: () => {
        return {
          getAllSignatures: () => ['']
        } as unknown as avaxSerial.SignedTx
      },
      getTx: () => ({
        foo: 'bar'
      }),
      toBytes: () => ['']
    } as unknown as UnsignedTx

    it('should result 330030000000000n for single byte with base fee 30nAvax', async () => {
      const result = calculateCChainFee(
        new TokenUnit(30 * 10 ** 9, 18, 'AVAX'),
        unsignedTxMock
      )
      expect(result.toSubUnit()).toBe(330030000000000n)
    })

    it('should result 495045000000000n for single byte with base fee 45nAvax', async () => {
      const result = calculateCChainFee(
        new TokenUnit(45 * 10 ** 9, 18, 'AVAX'),
        unsignedTxMock
      )
      expect(result.toSubUnit()).toBe(495045000000000n)
    })
  })
})
