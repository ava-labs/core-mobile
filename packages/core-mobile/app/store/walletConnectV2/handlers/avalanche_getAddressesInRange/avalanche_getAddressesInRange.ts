import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod } from 'store/walletConnectV2'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import WalletService from 'services/wallet/WalletService'
import Logger from 'utils/Logger'
import { HandleResponse, RpcRequestHandler } from '../types'
import { getCorrectedLimit, parseRequestParams } from './utils'
import { RequestParams, avalancheGetAddressesInRangeRpcRequest } from './types'

class AvalancheGetAddressesInRangeHandler
  implements RpcRequestHandler<avalancheGetAddressesInRangeRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE]

  handle = async (
    request: avalancheGetAddressesInRangeRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const state = getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    const result = parseRequestParams(request.data.params.request.params)
    if (!result.success) {
      Logger.error('Invalid param', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'avalanche_getAddressesInRange param is invalid'
        })
      }
    }

    const [externalStart, internalStart, externalLimit, internalLimit] =
      result.data as RequestParams

    const addresses: { external: string[]; internal: string[] } = {
      external: [],
      internal: []
    }

    try {
      const correctedExternalLimit = getCorrectedLimit(externalLimit)
      const correctedInternalLimit = getCorrectedLimit(internalLimit)
      if (correctedExternalLimit > 0) {
        for (
          let index = externalStart;
          index < externalStart + correctedExternalLimit;
          index++
        ) {
          const xAddr = (
            await WalletService.getAddresses(index, isDeveloperMode)
          ).AVM.split('-')[1] as string
          addresses.external.push(xAddr)
        }
      }

      if (correctedInternalLimit > 0) {
        for (
          let index = internalStart;
          index < internalStart + correctedInternalLimit;
          index++
        ) {
          const pAddr = (
            await WalletService.getAddresses(index, isDeveloperMode)
          ).PVM.split('-')[1] as string
          addresses.internal.push(pAddr)
        }
      }
    } catch (e) {
      return {
        success: false,
        error: ethErrors.rpc.internal({
          message: (e as Error).message
        })
      }
    }

    return { success: true, value: addresses }
  }
}

export const avalancheGetAddressesInRangeHandler =
  new AvalancheGetAddressesInRangeHandler()
