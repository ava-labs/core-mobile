import { TokenType } from '@avalabs/vm-module-types'
import { Erc20TokenBalance } from '@avalabs/glacier-sdk'
import { isTokenVisible } from './utils'
import { LocalTokenWithBalance } from './types'

describe('isTokenVisible', () => {
  it('returns true if tokenVisible is true', () => {
    const tokenVisiblity = { '123': true }
    const token = { localId: '123' } as LocalTokenWithBalance
    expect(isTokenVisible(tokenVisiblity, token)).toBe(true)
  })

  it('returns false if tokenVisible is false', () => {
    const tokenVisiblity = { '123': false }
    const token = { localId: '123' } as LocalTokenWithBalance
    expect(isTokenVisible(tokenVisiblity, token)).toBe(false)
  })

  it('returns false if tokenVisible is undefined and isMalicious is true', () => {
    const tokenVisiblity = {}
    const token = {
      localId: '123',
      type: TokenType.ERC20,
      reputation: Erc20TokenBalance.tokenReputation.MALICIOUS
    } as LocalTokenWithBalance
    expect(isTokenVisible(tokenVisiblity, token)).toBe(false)
  })

  it('returns true if tokenVisible is undefined and isMalicious is false', () => {
    const tokenVisiblity = {}
    const token = {
      localId: '123',
      type: TokenType.ERC20,
      reputation: Erc20TokenBalance.tokenReputation.BENIGN
    } as LocalTokenWithBalance
    expect(isTokenVisible(tokenVisiblity, token)).toBe(true)
  })
})
