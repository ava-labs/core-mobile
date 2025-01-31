import {
  TokenWithBalance,
  NetworkContractToken
} from '@avalabs/vm-module-types'
import { isTokenVisible, getLocalTokenId } from './utils'

describe('isTokenVisible', () => {
  it('returns true if tokenVisible is true', () => {
    expect(isTokenVisible(true, false)).toBe(true)
  })

  it('returns false if tokenVisible is false', () => {
    expect(isTokenVisible(false, false)).toBe(false)
  })

  it('returns false if tokenVisible is undefined and isMalicious is true', () => {
    expect(isTokenVisible(undefined, true)).toBe(false)
  })

  it('returns true if tokenVisible is undefined and isMalicious is false', () => {
    expect(isTokenVisible(undefined, false)).toBe(true)
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
