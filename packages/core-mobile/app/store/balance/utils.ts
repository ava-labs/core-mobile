import {
  NetworkTokenWithBalance,
  TokenWithBalanceERC20
} from 'store/balance/types'
import { NetworkContractToken } from '@avalabs/chains-sdk'

export function getLocalTokenId(
  token: NetworkTokenWithBalance | TokenWithBalanceERC20 | NetworkContractToken
) {
  return 'address' in token ? token.address : `${token.name}${token.symbol}`
}
