import {
  NetworkContractToken,
  TokenType,
  TokenWithBalance
} from '@avalabs/vm-module-types'
import { getLocalTokenId } from './utils'

describe('getLocalTokenId', () => {
  it('returns the token address if it exists', () => {
    const token = { address: '0x123', name: 'name', symbol: 'symbol' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('0x123')
  })
  it('returns the token type and symbol if address does not exist', () => {
    const token = { type: TokenType.NATIVE, symbol: 'symbol' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('NATIVE-symbol')
  })
})
