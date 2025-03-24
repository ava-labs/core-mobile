import {
  TokenType,
  TokenWithBalance,
  TokenWithBalanceEVM
} from '@avalabs/vm-module-types'

export const isSupportedToken = (
  token: TokenWithBalance
): token is TokenWithBalanceEVM => {
  return (
    token.type === TokenType.ERC20 ||
    token.type === TokenType.ERC721 ||
    token.type === TokenType.ERC1155 ||
    token.type === TokenType.NATIVE
  )
}
