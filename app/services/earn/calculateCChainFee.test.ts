import { calculateCChainFee } from 'services/earn/calculateCrossChainFees'
import { avaxSerial, UnsignedTx } from '@avalabs/avalanchejs-v2'
import { Avax } from 'types/Avax'

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

    it('should result 0.00033003 for single byte with base fee 30nAvax', async () => {
      const result = calculateCChainFee(
        Avax.fromNanoAvax(30),
        unsignedTxMock,
        unsignedTxMock.getSignedTx()
      )
      expect(result.toString()).toBe('0.00033003')
    })

    it('should result 0.000495045 for single byte with base fee 45nAvax', async () => {
      const result = calculateCChainFee(
        Avax.fromNanoAvax(45),
        unsignedTxMock,
        unsignedTxMock.getSignedTx()
      )
      expect(result.toString()).toBe('0.000495045')
    })
  })
})
