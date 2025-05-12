import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'

export const isErc20 = (token: NetworkContractToken): boolean => {
  return (
    token.type === TokenType.ERC20 ||
    (token.type !== TokenType.SPL &&
      'contractType' in token &&
      token.contractType === 'ERC-20')
  )
}
