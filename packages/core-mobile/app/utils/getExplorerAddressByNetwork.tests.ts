// Add tests for getExplorerAddressByNetwork

import { getExplorerAddressByNetwork } from './getExplorerAddressByNetwork'

describe('getExplorerAddressByNetwork', () => {
  it('should return the correct explorer address', () => {
    const explorerUrl = 'https://explorer.avax.network'
    const hash = '0x1234567890abcdef1234567890abcdef12345678'
    const hashType = 'tx'
    const result = getExplorerAddressByNetwork(explorerUrl, hash, hashType)
    expect(result).toBe(
      'https://solscan.io/tx/0x1234567890abcdef1234567890abcdef12345678'
    )
  })
  it('should return the correct explorer address with query params', () => {
    const explorerUrl = 'https://explorer.avax.network?foo=bar'
    const hash = '0x1234567890abcdef1234567890abcdef12345678'
    const hashType = 'account'
    const result = getExplorerAddressByNetwork(explorerUrl, hash, hashType)
    expect(result).toBe(
      'https://solscan.io/account/0x1234567890abcdef1234567890abcdef12345678?foo=bar'
    )
  })
  it('should return the correct explorer address with path params', () => {
    const explorerUrl = 'https://explorer.avax.network/foo/bar'
    const hash = '0x1234567890abcdef1234567890abcdef12345678'
    const hashType = 'tx'
    const result = getExplorerAddressByNetwork(explorerUrl, hash, hashType)
    expect(result).toBe(
      'https://solscan.io/foo/bar/tx/0x1234567890abcdef1234567890abcdef12345678'
    )
  })
  it('should return the correct explorer address with path params and query params', () => {
    const explorerUrl = 'https://explorer.avax.network/foo/bar?foo=bar'
    const hash = '0x1234567890abcdef1234567890abcdef12345678'
    const hashType = 'account'
    const result = getExplorerAddressByNetwork(explorerUrl, hash, hashType)
    expect(result).toBe(
      'https://solscan.io/foo/bar/account/0x1234567890abcdef1234567890abcdef12345678?foo=bar'
    )
  })
})
