import { rpcErrors } from '@metamask/rpc-errors'
import type { TransactionRequest } from 'ethers'
import type { RpcRequest as VmModuleRpcRequest } from '@avalabs/vm-module-types'
import type { AppListenerEffectAPI } from 'store/types'
import { selectActiveWalletId, selectActiveWallet } from 'store/wallet/slice'
import { selectActiveAccount } from 'store/account/slice'
import { selectNetwork } from 'store/network/slice'
import { selectIsQuickSwapsAvailable } from 'store/posthog/slice'
import ModuleManager from 'vmModule/ModuleManager'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import {
  CORE_MOBILE_TOPIC,
  RequestContext,
  RpcMethod,
  type RpcRequest as InAppRpcRequest
} from '../../types'
import type { HandleResponse, RpcRequestHandler } from '../types'

type BatchEvmTxParam = TransactionRequest

type BatchParams = {
  transactions: BatchEvmTxParam[]
  options?: {
    skipIntermediateTxs?: boolean
  }
}

const isBatchParams = (value: unknown): value is BatchParams => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { transactions?: unknown }
  return (
    Array.isArray(candidate.transactions) && candidate.transactions.length > 0
  )
}

export type EthSendTransactionBatchRpcRequest =
  InAppRpcRequest<RpcMethod.ETH_SEND_TRANSACTION_BATCH>

// Trust boundary: only CORE_MOBILE_TOPIC requests reach the bypass.
class EthSendTransactionBatchHandler
  implements RpcRequestHandler<EthSendTransactionBatchRpcRequest, string[]>
{
  methods = [RpcMethod.ETH_SEND_TRANSACTION_BATCH]

  handle = async (
    request: EthSendTransactionBatchRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<string[]> => {
    if (request.data.topic !== CORE_MOBILE_TOPIC) {
      return {
        success: false,
        error: rpcErrors.invalidRequest({
          message:
            'eth_sendTransactionBatch is only available for in-app initiated requests'
        })
      }
    }

    const inner = request.data.params.request.params
    if (!isBatchParams(inner)) {
      return {
        success: false,
        error: rpcErrors.invalidParams({
          message:
            'eth_sendTransactionBatch requires a non-empty `transactions` array'
        })
      }
    }

    const state = listenerApi.getState()
    const activeWalletId = selectActiveWalletId(state)
    const activeWallet = selectActiveWallet(state)
    const activeAccount = selectActiveAccount(state)

    if (!activeWalletId || !activeWallet || !activeAccount) {
      return {
        success: false,
        error: rpcErrors.internal({
          message:
            'eth_sendTransactionBatch requires an active wallet and account'
        })
      }
    }

    const numericChainId = getChainIdFromCaip2(request.data.params.chainId)
    const network = numericChainId
      ? selectNetwork(numericChainId)(state)
      : undefined
    if (!network || numericChainId === undefined) {
      return {
        success: false,
        error: rpcErrors.invalidRequest({
          message: `eth_sendTransactionBatch: unknown network for chainId ${request.data.params.chainId}`
        })
      }
    }

    // EVM module's Zod schema requires `z.tuple([fe, fe]).rest(fe)`.
    if (inner.transactions.length < 2) {
      return {
        success: false,
        error: rpcErrors.invalidParams({
          message:
            'eth_sendTransactionBatch requires at least 2 transactions; route single-tx flows through eth_sendTransaction'
        })
      }
    }

    // Mirror handleRequestViaVMModule's signing-context injection —
    // this handler reaches the module via a direct call instead.
    const sdkRequest = {
      requestId: String(request.data.id),
      sessionId: request.data.topic,
      chainId: request.data.params.chainId,
      dappInfo: {
        name: request.peerMeta.name,
        icon: request.peerMeta.icons[0] ?? '',
        url: request.peerMeta.url
      },
      method: request.method,
      params: inner,
      context: {
        ...request.context,
        walletId: activeWalletId,
        walletType: activeWallet.type,
        accountIndex: activeAccount.index,
        network,
        [RequestContext.QUICK_SWAPS_AVAILABLE]:
          selectIsQuickSwapsAvailable(state)
      }
    } as unknown as VmModuleRpcRequest

    const evmModule = ModuleManager.evmModule
    const response = await evmModule.onRpcRequest(sdkRequest, network as never)

    if ('error' in response) {
      const err = response.error
      return {
        success: false,
        error:
          typeof err === 'string'
            ? rpcErrors.internal({ message: err })
            : (err as ReturnType<typeof rpcErrors.internal>)
      }
    }

    return {
      success: true,
      value: response.result as string[]
    }
  }
}

export const ethSendTransactionBatchHandler =
  new EthSendTransactionBatchHandler()
