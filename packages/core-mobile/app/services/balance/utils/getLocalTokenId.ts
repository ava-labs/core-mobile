import {
  type TokenWithBalance,
  NetworkContractToken,
  TokenType
} from '@avalabs/vm-module-types'
import Logger from 'utils/Logger'

export function getLocalTokenId(
  token: TokenWithBalance | NetworkContractToken
): string {
  const fallbackTokenId = `${token.type}-${token.symbol}`
  if (token.type === TokenType.NATIVE) {
    return fallbackTokenId
  }

  if (!token.address) {
    Logger.error('Token address is missing', { token })
    return fallbackTokenId
  }

  return token.address
}
