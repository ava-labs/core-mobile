import { rpcErrors } from '@metamask/rpc-errors'
import { ERC20Token, TokenType } from '@avalabs/vm-module-types'
import { isAddress } from 'ethers'
import { router } from 'expo-router'
import { addCustomToken } from 'store/customToken/slice'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { AppListenerEffectAPI } from 'store/types'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'

export type WalletWatchAssetRpcRequest =
  RpcRequest<RpcMethod.WALLET_WATCH_ASSET>

class WalletWatchAssetHandler
  implements RpcRequestHandler<WalletWatchAssetRpcRequest>
{
  methods = [RpcMethod.WALLET_WATCH_ASSET]

  handle = async (
    request: WalletWatchAssetRpcRequest,
    _listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { params } = request.data.params.request
    // EIP-747 params can be array [{ type, options }] or object { type, options }
    const raw = Array.isArray(params) ? params[0] : params
    const param = raw as
      | { type?: string; options?: Record<string, unknown> }
      | undefined

    const decimalsRaw = param?.options?.decimals
    // Accept only a non-negative integer or a string of digits — rejects '', ' ',
    // '1.5', etc. that Number() would silently coerce to an unexpected value.
    let decimals: number
    if (typeof decimalsRaw === 'number') {
      decimals = decimalsRaw
    } else if (typeof decimalsRaw === 'string' && /^\d+$/.test(decimalsRaw)) {
      decimals = Number(decimalsRaw)
    } else {
      decimals = NaN
    }
    const isValidDecimals =
      Number.isInteger(decimals) && decimals >= 0 && decimals <= 255

    // Validate image before use — only accept it when it is actually a string.
    const imageRaw = param?.options?.image
    const image = typeof imageRaw === 'string' ? imageRaw : undefined

    if (
      param?.type !== 'ERC20' ||
      typeof param.options?.address !== 'string' ||
      !isAddress(param.options.address) ||
      typeof param.options?.symbol !== 'string' ||
      !isValidDecimals
    ) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Invalid wallet_watchAsset params')
      }
    }

    const address = param.options.address as string
    const symbol = param.options.symbol as string

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
    const data = payload.data as { token: ERC20Token } | undefined

    if (!data?.token) {
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

    dispatch(addCustomToken({ chainId, token: data.token }))
    return { success: true, value: true }
  }
}

export const walletWatchAssetHandler = new WalletWatchAssetHandler()
