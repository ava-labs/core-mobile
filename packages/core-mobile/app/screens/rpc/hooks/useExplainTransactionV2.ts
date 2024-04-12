import { EthSendTransactionRpcRequest } from 'store/walletConnectV2/handlers/eth_sendTransaction/eth_sendTransaction'
import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { useNetworks } from 'hooks/useNetworks'
import { useExplainTransactionShared } from './useExplainTransactionShared'
import { ExplainTransactionSharedTypes } from './types'

export function useExplainTransactionV2(
  request: EthSendTransactionRpcRequest,
  txParams: TransactionParams,
  onError: (error?: string) => void
): ExplainTransactionSharedTypes {
  const { getNetwork } = useNetworks()
  const chainId = request.data.params.chainId.split(':')[1]
  const network = getNetwork(Number(chainId))
  const peerMeta = request.session.peer.metadata
  const args = { network, txParams, peerMeta, onError }

  return useExplainTransactionShared(args)
}
