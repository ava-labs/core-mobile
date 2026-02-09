import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'

export const getTokenAddress = (token?: TokenWithBalance): string => {
  if (!token) {
    return ''
  }
  return token.type === TokenType.NATIVE ? token.symbol : token.address
}
