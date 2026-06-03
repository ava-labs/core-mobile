import {
  resolveGrantedAccounts,
  resolveActiveConnectedAccounts
} from './resolveGrantedAccounts'

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
    // deferred to the permissions slice.
    expect(resolveGrantedAccounts(['0xABC', '0xDEF'], '0xabc')).toEqual([
      '0xABC',
      '0xDEF'
    ])
  })
})

describe('resolveActiveConnectedAccounts', () => {
  it('returns the granted set (active first) when active is granted', () => {
    expect(
      resolveActiveConnectedAccounts(['0xOther', '0xActive'], '0xActive')
    ).toEqual(['0xActive', '0xOther'])
  })

  it('returns [] when the active account is NOT in the granted set', () => {
    // The reconciliation rule: the injected signer always uses the active
    // account, so an ungranted active must look disconnected to the dApp.
    expect(
      resolveActiveConnectedAccounts(['0xA', '0xB'], '0xUngranted')
    ).toEqual([])
  })

  it('returns [] when active is undefined', () => {
    expect(resolveActiveConnectedAccounts(['0xA', '0xB'], undefined)).toEqual(
      []
    )
  })

  it('returns [] when nothing is granted', () => {
    expect(resolveActiveConnectedAccounts([], '0xActive')).toEqual([])
  })
})
