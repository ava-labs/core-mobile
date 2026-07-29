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

  // Hypercore spot tokens carry no address by design (identified by index) —
  // fall back without logging.
  if (token.type === TokenType.HYPERCORE_SPOT) {
    return fallbackTokenId
  }

  if (!('address' in token) || !token.address) {
    Logger.error('Token address is missing', { token })
    return fallbackTokenId
  }

  return token.address
}
