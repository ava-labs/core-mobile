import { TokenUnit } from '@avalabs/core-utils-sdk'
import { addBufferToCChainBaseFee } from './utils'

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
