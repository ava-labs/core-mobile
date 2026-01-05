import { TokenVisibility } from 'store/portfolio'
import { isTokenMalicious } from 'utils/isTokenMalicious'
import { AdjustedLocalTokenWithBalance } from 'services/balance/types'

export function isTokenVisible(
  tokenVisibility: TokenVisibility,
  token: AdjustedLocalTokenWithBalance
): boolean {
  const isMalicious = isTokenMalicious(token)
  const tokenVisible = tokenVisibility[token.localId.toLowerCase()]
  return tokenVisible !== undefined ? tokenVisible : !isMalicious
}
