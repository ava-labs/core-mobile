import { isAddressLikeSearch } from './isAddressLikeSearch'

describe('isAddressLikeSearch', () => {
  it('returns false for token names', () => {
    expect(isAddressLikeSearch('pump', false)).toBe(false)
    expect(isAddressLikeSearch('pump.fun', false)).toBe(false)
    expect(isAddressLikeSearch('SOL', false)).toBe(false)
  })

  it('returns true for valid EVM address', () => {
    expect(
      isAddressLikeSearch('0x1234567890123456789012345678901234567890', false)
    ).toBe(true)
  })

  it('returns true for valid Solana address', () => {
    // USDC mint address on Solana
    const solanaAddr = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    expect(isAddressLikeSearch(solanaAddr, false)).toBe(true)
  })
})
