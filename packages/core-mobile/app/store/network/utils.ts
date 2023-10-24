import { Network } from '@avalabs/chains-sdk'
import { CustomTokenState } from 'store/customToken'

export const mergeWithCustomTokens = (
  network: Network,
  allCustomTokens: CustomTokenState['tokens']
) => {
  const customTokens = allCustomTokens[network.chainId]

  if (!network.tokens || !customTokens || customTokens.length === 0)
    return network

  return {
    ...network,
    tokens: [...network.tokens, ...customTokens]
  }
}
