import { calculateCChainFee } from 'services/earn/calculateCrossChainFees'
import { avaxSerial, UnsignedTx } from '@avalabs/avalanchejs-v2'

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

    it('should result 330030 for single byte with base fee 30nAvax', async () => {
      const result = calculateCChainFee(
        BigInt(30e9),
        unsignedTxMock,
        unsignedTxMock.getSignedTx()
      )
      expect('330030').toBe(result.toString())
    })

    it('should result 495045 for single byte with base fee 45nAvax', async () => {
      const result = calculateCChainFee(
        BigInt(45e9),
        unsignedTxMock,
        unsignedTxMock.getSignedTx()
      )
      expect('495045').toBe(result.toString())
    })
  })
})
