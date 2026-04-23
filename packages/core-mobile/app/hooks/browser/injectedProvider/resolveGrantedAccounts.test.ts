import { resolveGrantedAccounts } from './resolveGrantedAccounts'

describe('resolveGrantedAccounts', () => {
  it('returns an empty list when nothing is granted', () => {
    expect(resolveGrantedAccounts([], '0xActive')).toEqual([])
    expect(resolveGrantedAccounts([], undefined)).toEqual([])
  })

  it('sorts the active address first when it is in the granted set', () => {
    expect(
      resolveGrantedAccounts(['0xOther', '0xActive', '0xAnother'], '0xActive')
    ).toEqual(['0xActive', '0xOther', '0xAnother'])
  })

  it('returns the granted list unchanged when active is absent', () => {
    expect(
      resolveGrantedAccounts(['0xOther', '0xAnother'], '0xActive')
    ).toEqual(['0xOther', '0xAnother'])
  })

  it('returns the granted list unchanged when active is undefined', () => {
    expect(resolveGrantedAccounts(['0xA', '0xB'], undefined)).toEqual([
      '0xA',
      '0xB'
    ])
  })

  it('is case-sensitive on the active-address comparison', () => {
    // Documents current behavior — case normalization is intentionally
    // deferred to the permissions slice (see reviewer issue Q9 in Phase 3c).
    expect(
      resolveGrantedAccounts(['0xABC', '0xDEF'], '0xabc')
    ).toEqual(['0xABC', '0xDEF'])
  })
})
