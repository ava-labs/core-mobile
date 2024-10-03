import { TokenUnit } from '@avalabs/core-utils-sdk'

export function getCChainTokenUnit(): TokenUnit {
  return new TokenUnit(0, 18, 'AVAX')
}
export function getXPChainTokenUnit(): TokenUnit {
  return new TokenUnit(0, 9, 'AVAX')
}
