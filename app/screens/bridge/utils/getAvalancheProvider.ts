import { Network } from '@avalabs/chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'

export function getAvalancheProvider(network: Network): JsonRpcBatchInternal {
  return new JsonRpcBatchInternal(40, network?.rpcUrl, network?.chainId)
}
