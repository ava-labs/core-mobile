import { LocalTokenWithBalance, TokenType } from 'store/balance'

export const getSelectedToken = (token: LocalTokenWithBalance) => {
  return token.type === TokenType.ERC20 ? token.address : token.symbol
}
