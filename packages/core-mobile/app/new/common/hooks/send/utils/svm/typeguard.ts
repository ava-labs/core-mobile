import {
  TokenType,
  TokenWithBalance,
  TokenWithBalanceSVM
} from '@avalabs/vm-module-types'

export const isSupportedSVMToken = (
  token: TokenWithBalance
): token is TokenWithBalanceSVM => {
  return token.type === TokenType.SPL || token.type === TokenType.NATIVE
}
