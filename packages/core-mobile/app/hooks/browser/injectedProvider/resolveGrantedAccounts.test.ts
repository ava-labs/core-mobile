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

  it('matches the active address case-insensitively and sorts the stored grant first', () => {
    // EVM addresses vary by hex casing; a lowercased active address must still
    // match a mixed-case grant and be sorted first, preserving the stored
    // casing in the output.
    expect(resolveGrantedAccounts(['0xDEF', '0xABC'], '0xabc')).toEqual([
      '0xABC',
      '0xDEF'
    ])
  })

  it('de-dupes addresses that differ only by hex casing, keeping the first-seen casing', () => {
    // Permissions are keyed by raw address string and not normalized on grant,
    // so the same address can be stored twice under different casing.
    expect(
      resolveGrantedAccounts(['0xABC', '0xabc', '0xDEF'], undefined)
    ).toEqual(['0xABC', '0xDEF'])
  })

  it('de-dupes case-insensitive duplicates before applying active-first ordering', () => {
    expect(
      resolveGrantedAccounts(['0xDEF', '0xABC', '0xabc'], '0xabc')
    ).toEqual(['0xABC', '0xDEF'])
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

  it('treats the active address as granted regardless of hex casing', () => {
    // The signing gate lowercases; connection state must agree, so an active
    // address that differs from a stored grant only by casing is still granted.
    expect(resolveActiveConnectedAccounts(['0xABC', '0xDEF'], '0xabc')).toEqual(
      ['0xABC', '0xDEF']
    )
  })
})
