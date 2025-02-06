import {
  TokenWithBalance,
  NetworkContractToken,
  TokenType
} from '@avalabs/vm-module-types'
import { Erc20TokenBalance } from '@avalabs/glacier-sdk'
import { isTokenVisible, getLocalTokenId } from './utils'
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

describe('getLocalTokenId', () => {
  it('returns the token address if it exists', () => {
    const token = { address: '0x123', name: 'name', symbol: 'symbol' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('0x123')
  })
  it('returns the token name and symbol if address does not exist', () => {
    const token = { name: 'name', symbol: 'symbol' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('namesymbol')
  })
})
