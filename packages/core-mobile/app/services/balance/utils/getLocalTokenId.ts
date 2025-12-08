import {
  type TokenWithBalance,
  NetworkContractToken,
  TokenType
} from '@avalabs/vm-module-types'

export function getLocalTokenId(
  token: TokenWithBalance | NetworkContractToken
): string {
  if (token.type === TokenType.NATIVE) {
    return `${token.type}-${token.symbol}`
  }

  return token.address
}
