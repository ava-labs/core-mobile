import {
  TokenType,
  TokenWithBalance,
  NetworkContractToken
} from '@avalabs/vm-module-types'
import { Erc20TokenBalance } from '@avalabs/glacier-sdk'

export const isTokenMalicious = (
  token: TokenWithBalance | NetworkContractToken
): boolean => {
  if (
    !('type' in token) ||
    token.type !== TokenType.ERC20 ||
    !('reputation' in token)
  ) {
    return false
  }

  return token.reputation === Erc20TokenBalance.tokenReputation.MALICIOUS
}
