import { getSwitchChainOrigin } from './getSwitchChainOrigin'

const peerMeta = (
  url: string,
  name = 'fallback'
): Parameters<typeof getSwitchChainOrigin>[0] => ({
  name,
  description: '',
  url,
  icons: []
})

describe('getSwitchChainOrigin', () => {
  it('returns the host of the committed URL', () => {
    expect(
      getSwitchChainOrigin(peerMeta('https://app.example.com/a?b=c'))
    ).toBe('app.example.com')
  })

  it('keeps a non-default port', () => {
    expect(getSwitchChainOrigin(peerMeta('https://example.com:8443/'))).toBe(
      'example.com:8443'
    )
  })

  it('falls back to the peer name when the URL is unavailable', () => {
    expect(getSwitchChainOrigin(peerMeta('', 'Unknown site'))).toBe(
      'Unknown site'
    )
  })
})
