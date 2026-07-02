import { normalizeAnalyticsAddress } from './normalizeAnalyticsAddress'

describe('normalizeAnalyticsAddress', () => {
  it('lowercases EIP-55 checksummed EVM (hex) addresses', () => {
    expect(
      normalizeAnalyticsAddress('0xcA0E993876152ccA6053eeDFC753092c8cE712D0')
    ).toBe('0xca0e993876152cca6053eedfc753092c8ce712d0')
  })

  it('leaves an already-lowercase hex address unchanged', () => {
    const addr = '0xaaaa000000000000000000000000000000000001'
    expect(normalizeAnalyticsAddress(addr)).toBe(addr)
  })

  it('normalizes a non-standard uppercase 0X prefix (dApp-supplied tx `from`)', () => {
    expect(
      normalizeAnalyticsAddress('0XAAAA000000000000000000000000000000000001')
    ).toBe('0xaaaa000000000000000000000000000000000001')
  })

  it('does NOT alter case-sensitive Solana base58 addresses', () => {
    const svm = '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW'
    expect(normalizeAnalyticsAddress(svm)).toBe(svm)
  })

  it('does NOT alter Bitcoin bech32 addresses', () => {
    const btc = 'tb1qlzsvluv4cahzz8zzwud40x2hn3zq4c7zak6spw'
    expect(normalizeAnalyticsAddress(btc)).toBe(btc)
  })

  it('does NOT alter Avalanche X/P bech32 addresses', () => {
    const pchain = 'P-fuji1e0r9s2lf6v9mfqyy6pxrpkar8dm5jxqcvhg99n'
    expect(normalizeAnalyticsAddress(pchain)).toBe(pchain)
  })

  it('returns an empty string untouched', () => {
    expect(normalizeAnalyticsAddress('')).toBe('')
  })
})
