import { getMeldChainName } from './meldChainNames'

describe('getMeldChainName', () => {
  it('returns the display name for a known chain code', () => {
    expect(getMeldChainName('AVAXC')).toBe('Avalanche C-Chain')
  })

  it.each(['constructor', '__proto__', 'toString'])(
    'does not resolve inherited property %s',
    code => {
      expect(getMeldChainName(code)).toBeUndefined()
    }
  )
})
