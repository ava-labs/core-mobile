import { EthSendTransactionRpcRequest } from 'store/walletConnect/handlers/eth_sendTransaction'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { useExplainTransactionShared } from './useExplainTransactionShared'

export function useExplainTransactionV1(
  request: EthSendTransactionRpcRequest,
  onError: (error?: string) => void
) {
  const activeNetwork = useSelector(selectActiveNetwork)
  const txParams =
    request.payload.params.length > 0 ? request.payload.params[0] : undefined
  const peerMeta = request.payload.peerMeta
  const args = { network: activeNetwork, txParams, peerMeta, onError }

  return useExplainTransactionShared(args)
}
