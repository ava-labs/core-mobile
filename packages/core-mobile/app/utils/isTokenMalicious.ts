import { TokenType } from '@avalabs/vm-module-types'
import { Erc20TokenBalance } from '@avalabs/glacier-sdk'
import { AdjustedLocalTokenWithBalance } from 'services/balance/types'

export const isTokenMalicious = (
  token: AdjustedLocalTokenWithBalance
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
