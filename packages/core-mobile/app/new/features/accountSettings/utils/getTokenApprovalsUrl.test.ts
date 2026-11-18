import { getTokenApprovalsUrl, REVOKE_CASH_URL } from './getTokenApprovalsUrl'

const ADDRESS = '0x341b0073b66bfc19FCB54308861f604F5Eb8f51b'

describe('getTokenApprovalsUrl', () => {
  it('links to the revoke.cash address page on Avalanche C-Chain', () => {
    expect(
      getTokenApprovalsUrl({ address: ADDRESS, isDeveloperMode: false })
    ).toBe(`https://revoke.cash/address/${ADDRESS}?chainId=43114`)
  })

  it('uses Fuji in developer mode', () => {
    expect(
      getTokenApprovalsUrl({ address: ADDRESS, isDeveloperMode: true })
    ).toBe(`https://revoke.cash/address/${ADDRESS}?chainId=43113`)
  })

  it('always points at revoke.cash over https', () => {
    expect(REVOKE_CASH_URL).toBe('https://revoke.cash')
  })
})
