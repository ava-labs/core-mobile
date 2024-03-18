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

      const externalIndices = Array.from(
        { length: correctedExternalLimit },
        (_, i) => externalStart + i
      )
      addresses.external = (
        await WalletService.getAddressesByIndices({
          indices: externalIndices ?? [],
          chainAlias: 'X',
          isChange: false,
          isTestnet: isDeveloperMode
        })
      ).map(address => address.split('-')[1] as string)

      const internalIndices = Array.from(
        { length: correctedInternalLimit },
        (_, i) => internalStart + i
      )

      addresses.internal = (
        await WalletService.getAddressesByIndices({
          indices: internalIndices ?? [],
          chainAlias: 'X',
          isChange: true,
          isTestnet: isDeveloperMode
        })
      ).map(address => address.split('-')[1] as string)
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
