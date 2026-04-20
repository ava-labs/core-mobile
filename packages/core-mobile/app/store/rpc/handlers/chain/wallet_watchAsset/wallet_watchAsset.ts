import { rpcErrors } from '@metamask/rpc-errors'
import { ERC20Token, TokenType } from '@avalabs/vm-module-types'
import { router } from 'expo-router'
import { addCustomToken, selectAllCustomTokens } from 'store/customToken/slice'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { AppListenerEffectAPI } from 'store/types'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type WalletWatchAssetRpcRequest =
  RpcRequest<RpcMethod.WALLET_WATCH_ASSET>

class WalletWatchAssetHandler
  implements RpcRequestHandler<WalletWatchAssetRpcRequest>
{
  methods = [RpcMethod.WALLET_WATCH_ASSET]

  handle = async (
    request: WalletWatchAssetRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { params } = request.data.params.request
    const result = parseRequestParams(params)

    if (!result.success) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Invalid wallet_watchAsset params')
      }
    }

    const { address, symbol, decimals, image } = result.data.options

    const caip2ChainId = request.data.params.chainId
    const chainId = Number(caip2ChainId.split(':')[1])
    if (!Number.isInteger(chainId) || chainId <= 0) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Invalid chainId')
      }
    }
    const allCustomTokens = selectAllCustomTokens(listenerApi.getState())
    const tokensForChain = allCustomTokens[chainId] ?? []
    const alreadyAdded = tokensForChain.some(
      t => t.address.toLowerCase() === address.toLowerCase()
    )
    if (alreadyAdded) {
      return { success: true, value: true }
    }

    const token: ERC20Token = {
      type: TokenType.ERC20,
      address,
      name: symbol,
      symbol,
      decimals,
      logoUri: image ?? ''
    }

    walletConnectCache.watchAssetParams.set({ request, token })
    router.navigate('/watchAsset')
    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: WalletWatchAssetRpcRequest; data?: unknown },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: rpcErrors.internal('Invalid approve data')
      }
    }

    const caip2ChainId = payload.request.data.params.chainId
    const chainId = Number(caip2ChainId.split(':')[1])

    if (!Number.isInteger(chainId) || chainId <= 0) {
      return { success: false, error: rpcErrors.internal('Invalid chainId') }
    }

    const { token } = result.data
    const allCustomTokens = selectAllCustomTokens(listenerApi.getState())
    const tokensForChain = allCustomTokens[chainId] ?? []
    const alreadyAdded = tokensForChain.some(
      t => t.address.toLowerCase() === token.address.toLowerCase()
    )
    if (!alreadyAdded) {
      dispatch(addCustomToken({ chainId, token }))
    }
    return { success: true, value: true }
  }
}

export const walletWatchAssetHandler = new WalletWatchAssetHandler()
