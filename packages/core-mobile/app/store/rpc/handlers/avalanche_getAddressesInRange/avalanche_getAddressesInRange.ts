import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod } from 'store/rpc/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import Logger from 'utils/Logger'
import { getAddressesInRange } from 'utils/getAddressesInRange'
import { selectActiveWallet } from 'store/wallet/slice'
import { HandleResponse, RpcRequestHandler } from '../types'
import { parseRequestParams } from './utils'
import { RequestParams, AvalancheGetAddressesInRangeRpcRequest } from './types'

class AvalancheGetAddressesInRangeHandler
  implements RpcRequestHandler<AvalancheGetAddressesInRangeRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE]

  handle = async (
    request: AvalancheGetAddressesInRangeRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const state = getState()
    const activeWallet = selectActiveWallet(state)
    const isDeveloperMode = selectIsDeveloperMode(state)
    const result = parseRequestParams(request.data.params.request.params)
    if (!result.success) {
      Logger.error('Invalid param', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams(
          'avalanche_getAddressesInRange param is invalid'
        )
      }
    }

    if (!activeWallet) {
      return {
        success: false,
        error: rpcErrors.internal('No active wallet')
      }
    }

    const [externalStart, internalStart, externalLimit, internalLimit] =
      result.data as RequestParams

    try {
      const addresses = await getAddressesInRange({
        isDeveloperMode: isDeveloperMode,
        walletId: activeWallet.id,
        walletType: activeWallet.type,
        params: {
          externalStart,
          internalStart,
          externalLimit,
          internalLimit
        }
      })
      return { success: true, value: addresses }
    } catch (e) {
      return {
        success: false,
        error: rpcErrors.internal((e as Error).message)
      }
    }
  }
}

export const avalancheGetAddressesInRangeHandler =
  new AvalancheGetAddressesInRangeHandler()
