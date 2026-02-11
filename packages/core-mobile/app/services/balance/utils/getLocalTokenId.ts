import {
  type TokenWithBalance,
  NetworkContractToken,
  TokenType
} from '@avalabs/vm-module-types'

export function getLocalTokenId(
  token: TokenWithBalance | NetworkContractToken
): string {
  const fallbackTokenId = `${token.type}-${token.symbol}`
  if (token.type === TokenType.NATIVE) {
    return fallbackTokenId
  }

  return token.address ?? fallbackTokenId
}
