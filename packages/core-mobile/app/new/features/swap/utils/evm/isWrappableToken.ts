import { WRAPPABLE_TOKENS } from '../../consts'

export const isWrappableToken = (tokenAddress: string): boolean => {
  return WRAPPABLE_TOKENS.includes(tokenAddress.toLowerCase())
}
