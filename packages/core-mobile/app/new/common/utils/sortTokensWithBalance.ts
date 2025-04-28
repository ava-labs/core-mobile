import { TokenType } from '@avalabs/vm-module-types'
import { AVAX_P_ID, AVAX_X_ID, LocalTokenWithBalance } from 'store/balance'
import { TokenSymbol } from 'store/network'

export const sortedTokensWithBalance = (
  tokens: LocalTokenWithBalance[]
): LocalTokenWithBalance[] => {
  const primaryTokens: LocalTokenWithBalance[] = []
  const cChainToken = tokens.find(
    token =>
      token.type === TokenType.NATIVE && token.localId === 'AvalancheAVAX'
  )
  if (cChainToken) {
    primaryTokens.push(cChainToken)
  }
  const pChainToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.localId === AVAX_P_ID
  )
  if (pChainToken) {
    primaryTokens.push(pChainToken)
  }
  const xChainToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.localId === AVAX_X_ID
  )
  if (xChainToken) {
    primaryTokens.push(xChainToken)
  }
  const ethToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.symbol === TokenSymbol.ETH
  )
  ethToken && primaryTokens.push(ethToken)

  const btcToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.symbol === TokenSymbol.BTC
  )
  btcToken && primaryTokens.push(btcToken)

  const rest = tokens.filter(
    token =>
      token.localId !== 'AvalancheAVAX' &&
      token.localId !== AVAX_P_ID &&
      token.localId !== AVAX_X_ID &&
      token.symbol !== TokenSymbol.ETH &&
      token.symbol !== TokenSymbol.BTC
  )
  const sorted = rest.sort(
    (a, b) => Number(b.balanceInCurrency) - Number(a.balanceInCurrency)
  )
  return [...primaryTokens, ...sorted]
}
