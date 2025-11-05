import {
  type TokenWithBalance,
  NetworkContractToken
} from '@avalabs/vm-module-types'

export function getLocalTokenId(
  token: TokenWithBalance | NetworkContractToken
): string {
  return 'address' in token ? token.address : `${token.name}${token.symbol}`
}
