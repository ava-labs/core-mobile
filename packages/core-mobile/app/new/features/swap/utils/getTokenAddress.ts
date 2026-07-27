import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'

export const getTokenAddress = (token?: TokenWithBalance): string => {
  if (!token) {
    return ''
  }
  if (token.type === TokenType.NATIVE) {
    return token.symbol
  }
  // Hypercore spot tokens have no EVM address and are not swappable.
  return 'address' in token ? token.address : ''
}
