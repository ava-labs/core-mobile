import { TokenType } from '@avalabs/vm-module-types'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { AVAX_P_ID, AVAX_X_ID, LocalTokenWithBalance } from 'store/balance'
import { TokenSymbol } from 'store/network'

export const sortTokensWithPrimaryFirst = ({
  tokens,
  sortOthersByBalance = true
}: {
  tokens: LocalTokenWithBalance[]
  sortOthersByBalance?: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
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
    token =>
      token.type === TokenType.NATIVE &&
      token.symbol === TokenSymbol.ETH &&
      isEthereumChainId(token.networkChainId)
  )
  if (ethToken) primaryTokens.push(ethToken)

  const btcToken = tokens.find(
    token => token.type === TokenType.NATIVE && token.symbol === TokenSymbol.BTC
  )
  if (btcToken) primaryTokens.push(btcToken)

  let rest = tokens.filter(
    token =>
      !(token.symbol === TokenSymbol.AVAX && token.type === TokenType.NATIVE) &&
      !(
        token.symbol === TokenSymbol.ETH &&
        token.type === TokenType.NATIVE &&
        isEthereumChainId(token.networkChainId)
      ) &&
      !(token.symbol === TokenSymbol.BTC && token.type === TokenType.NATIVE)
  )

  if (sortOthersByBalance) {
    rest = rest.toSorted(
      (a, b) =>
        Number(b.balanceInCurrency ?? 0) - Number(a.balanceInCurrency ?? 0)
    )
  }

  return [...primaryTokens, ...rest]
}
