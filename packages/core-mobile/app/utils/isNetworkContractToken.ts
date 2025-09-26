import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'

export function isNetworkContractToken(token: {
  type: TokenType
}): token is NetworkContractToken {
  return (
    token.type === TokenType.ERC20 ||
    token.type === TokenType.ERC1155 ||
    token.type === TokenType.ERC721 ||
    token.type === TokenType.NONERC ||
    token.type === TokenType.SPL
  )
}
