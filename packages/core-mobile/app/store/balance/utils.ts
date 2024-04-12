import {
  NetworkTokenWithBalance,
  TokenWithBalanceERC20,
  XPTokenWithBalance
} from 'store/balance/types'
import { NetworkContractToken } from '@avalabs/chains-sdk'

export function getLocalTokenId(
  token:
    | NetworkTokenWithBalance
    | TokenWithBalanceERC20
    | NetworkContractToken
    | XPTokenWithBalance
): string {
  return 'address' in token ? token.address : `${token.name}${token.symbol}`
}
