import { TokenUnit } from '@avalabs/core-utils-sdk'
import { NetworkToken } from '@avalabs/core-chains-sdk'

export function zeroAvaxPChain(): TokenUnit {
  return new TokenUnit(0, 9, 'AVAX')
}
export function zeroTokenUnit(networkToken: NetworkToken): TokenUnit {
  return new TokenUnit(0, networkToken.decimals, networkToken.symbol)
}
