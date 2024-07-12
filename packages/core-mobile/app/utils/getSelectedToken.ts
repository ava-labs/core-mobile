import { LocalTokenWithBalance, TokenType } from 'store/balance/types'

export const getSelectedToken = (token: LocalTokenWithBalance): string => {
  return token.type === TokenType.ERC20 ? token.address : token.symbol
}
