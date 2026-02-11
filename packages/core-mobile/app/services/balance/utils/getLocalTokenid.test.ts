import {
  type TokenWithBalance,
  NetworkContractToken,
  TokenType
} from '@avalabs/vm-module-types'
import { getLocalTokenId } from './getLocalTokenId'

describe('getLocalTokenId', () => {
  it('returns the token address for non-native tokens', () => {
    const token = { address: '0x123', name: 'name', symbol: 'symbol' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('0x123')
  })

  it('returns type-symbol for native tokens', () => {
    const token = { type: TokenType.NATIVE, symbol: 'AVAX' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('NATIVE-AVAX')
  })

  it('falls back to type-symbol when non-native token has no address', () => {
    const token = { type: TokenType.ERC20, symbol: 'USDC' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('ERC20-USDC')
  })
})
