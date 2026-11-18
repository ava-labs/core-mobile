import { getAddressExplorerUrl } from './getAddressExplorerUrl'

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

describe('getAddressExplorerUrl', () => {
  it('builds an address URL on the network explorer', () => {
    expect(getAddressExplorerUrl('https://etherscan.io', ADDRESS)).toBe(
      `https://etherscan.io/address/${ADDRESS}`
    )
  })

  it('keeps the explorer path and query params', () => {
    expect(
      getAddressExplorerUrl(
        'https://subnets.avax.network/c-chain?foo=bar',
        ADDRESS
      )
    ).toBe(`https://subnets.avax.network/c-chain/address/${ADDRESS}?foo=bar`)
  })

  it.each([undefined, ''])(
    'returns undefined when the network has no explorer (%p)',
    explorerUrl => {
      expect(getAddressExplorerUrl(explorerUrl, ADDRESS)).toBeUndefined()
    }
  )

  it('returns undefined without an address', () => {
    expect(getAddressExplorerUrl('https://etherscan.io', '')).toBeUndefined()
  })

  it.each(['data:text/html,hello', 'not a url', 'ftp://explorer.io'])(
    'returns undefined for a non-http(s) explorer (%p)',
    explorerUrl => {
      expect(getAddressExplorerUrl(explorerUrl, ADDRESS)).toBeUndefined()
    }
  )
})
