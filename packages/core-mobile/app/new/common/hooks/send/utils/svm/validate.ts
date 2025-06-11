import { TokenWithBalance, TokenWithBalanceSVM } from '@avalabs/vm-module-types'
import { isSupportedSVMToken } from './typeguard'

export function validateSupportedToken(
  token: TokenWithBalance
): asserts token is TokenWithBalanceSVM {
  if (!isSupportedSVMToken(token)) {
    throw new Error('Unsupported token')
  }
}
