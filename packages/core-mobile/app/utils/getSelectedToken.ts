import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance/types'

export const getSelectedToken = (token: LocalTokenWithBalance): string => {
  return token.type === TokenType.ERC20 ? token.address : token.symbol
}
