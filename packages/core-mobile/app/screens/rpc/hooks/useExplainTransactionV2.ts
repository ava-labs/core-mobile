import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import { EthSendTransactionRpcRequest } from 'store/walletConnectV2/handlers/eth_sendTransaction/eth_sendTransaction'
import { TransactionParams } from 'store/walletConnectV2/handlers/eth_sendTransaction/utils'
import { useExplainTransactionShared } from './useExplainTransactionShared'

export function useExplainTransactionV2(
  request: EthSendTransactionRpcRequest,
  txParams: TransactionParams,
  onError: (error?: string) => void
) {
  const chainId = request.data.params.chainId.split(':')[1]
  const network = useSelector(selectNetwork(Number(chainId)))
  const peerMeta = request.peerMeta
  const args = { network, txParams, peerMeta, onError }

  return useExplainTransactionShared(args)
}
