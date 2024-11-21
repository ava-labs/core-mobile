import { caip2 } from '@avalabs/bridge-unified'

export const caipToChainId = (identifier: string): number => {
  return parseInt(caip2.toJSON(identifier).reference)
}
