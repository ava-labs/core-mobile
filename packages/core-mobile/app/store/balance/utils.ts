import type {
  NetworkContractToken,
  TokenWithBalance
} from '@avalabs/vm-module-types'
import { TokenVisibility } from 'store/portfolio'
import { isTokenMalicious } from 'utils/isTokenMalicious'
import { LocalTokenWithBalance } from './types'

export function getLocalTokenId(
  token: TokenWithBalance | NetworkContractToken
): string {
  return 'address' in token ? token.address : `${token.name}${token.symbol}`
}

export function isTokenVisible(
  tokenVisibility: TokenVisibility,
  token: LocalTokenWithBalance
): boolean {
  const isMalicious = isTokenMalicious(token)
  const tokenVisible = tokenVisibility[token.localId.toLowerCase()]
  return tokenVisible !== undefined ? tokenVisible : !isMalicious
}
