import { caip2 } from '@avalabs/bridge-unified'

export const chainIdToCaip = (
  chainId: number,
  namespace = 'eip155'
): string => {
  return caip2.toString({ namespace, reference: chainId.toString() })
}

export const caipToChainId = (identifier: string): number => {
  return parseInt(caip2.toJSON(identifier).reference)
}
