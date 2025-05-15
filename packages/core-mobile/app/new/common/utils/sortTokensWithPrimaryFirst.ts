import { TokenType } from '@avalabs/vm-module-types'
import { AVAX_P_ID, AVAX_X_ID, LocalTokenWithBalance } from 'store/balance'
import { TokenSymbol } from 'store/network'

export const sortTokensWithPrimaryFirst = ({
  tokens,
  sortOthersByBalance = true
}: {
  tokens: LocalTokenWithBalance[]
  sortOthersByBalance?: boolean
}): LocalTokenWithBalance[] => {
  const primaryTokens: LocalTokenWithBalance[] = []

  const cChainToken = tokens.find(
    token =>
      token.type === TokenType.NATIVE && token.localId === 'AvalancheAVAX'
  )
  if (cChainToken) primaryTokens.push(cChainToken)

  const pChainToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.localId === AVAX_P_ID
  )
  if (pChainToken) primaryTokens.push(pChainToken)

  const xChainToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.localId === AVAX_X_ID
  )
  if (xChainToken) primaryTokens.push(xChainToken)

  const ethToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.symbol === TokenSymbol.ETH
  )
  if (ethToken) primaryTokens.push(ethToken)

  const btcToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.symbol === TokenSymbol.BTC
  )
  if (btcToken) primaryTokens.push(btcToken)

  let rest = tokens.filter(token => token.type !== TokenType.NATIVE)

  if (sortOthersByBalance) {
    rest = rest.toSorted(
      (a, b) =>
        Number(b.balanceInCurrency ?? 0) - Number(a.balanceInCurrency ?? 0)
    )
  }

  return [...primaryTokens, ...rest]
}
