import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'

export const isErc20 = (token: NetworkContractToken): boolean => {
  return (
    token.type === TokenType.ERC20 ||
    ('contractType' in token && token.contractType === 'ERC-20')
  )
}
