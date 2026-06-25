import { clampToNAvax } from './clampToNAvax'

describe('clampToNAvax', () => {
  // 1 AVAX = 1e18 wei on C-Chain = 1e9 nAVAX
  it('leaves whole AVAX (1 AVAX) untouched', () => {
    expect(clampToNAvax(10n ** 18n, 18)).toBe(10n ** 18n)
  })

  it('leaves an exact 1 nAVAX amount untouched', () => {
    expect(clampToNAvax(10n ** 9n, 18)).toBe(10n ** 9n)
  })

  it('floors a sub-nAVAX amount down to zero', () => {
    // 0.0000000001 AVAX = 1e8 wei < 1 nAVAX → floor to 0
    expect(clampToNAvax(10n ** 8n, 18)).toBe(0n)
  })

  it('floors a 10-decimal amount down to the nearest nAVAX', () => {
    // 12.3456789012 AVAX = 123456789012 * 1e8 wei → floor to 12345678901 * 1e9 wei
    expect(clampToNAvax(123456789012n * 10n ** 8n, 18)).toBe(
      12345678901n * 10n ** 9n
    )
  })

  it('leaves an arbitrary multi-AVAX amount aligned to nAVAX untouched', () => {
    expect(clampToNAvax(12345678901n * 10n ** 9n, 18)).toBe(
      12345678901n * 10n ** 9n
    )
  })

  it('returns 9-decimal sources unchanged (P/X-Chain native AVAX)', () => {
    expect(clampToNAvax(123n, 9)).toBe(123n)
    expect(clampToNAvax(0n, 9)).toBe(0n)
  })

  it('returns sources with fewer than 9 decimals unchanged', () => {
    expect(clampToNAvax(7n, 6)).toBe(7n)
  })

  it('returns 0n unchanged', () => {
    expect(clampToNAvax(0n, 18)).toBe(0n)
  })
})
