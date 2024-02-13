import * as Sentry from '@sentry/react-native'
import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import BridgeService from 'services/bridge/BridgeService'
import { bnToBig, stringToBN } from '@avalabs/utils-sdk'
import { selectActiveAccount } from 'store/account'
import { selectNetworks } from 'store/network'
import Logger from 'utils/Logger'
import { selectBridgeAppConfig } from 'store/bridge/slice'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { RpcMethod, SessionRequest } from '../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'
import { parseApproveData, parseRequestParams } from './utils'

export type AvalancheBridgeAssetRequest =
  SessionRequest<RpcMethod.AVALANCHE_BRIDGE_ASSET>

class AvalancheBridgeAssetHandler
  implements RpcRequestHandler<AvalancheBridgeAssetRequest>
{
  methods = [RpcMethod.AVALANCHE_BRIDGE_ASSET]

  handle = async (request: AvalancheBridgeAssetRequest): HandleResponse => {
    const { params } = request.data.params.request
    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Params are invalid'
        })
      }
    }

    const [currentBlockchain, amountStr, asset] = result.data

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.BridgeAssetV2,
        params: { request, amountStr, asset, currentBlockchain }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: AvalancheBridgeAssetRequest; data?: unknown },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: ethErrors.rpc.internal('Invalid approve data')
      }
    }

    const state = listenerApi.getState()
    const isDeveloperMode = selectIsDeveloperMode(state)
    const activeAccount = selectActiveAccount(state)
    const allNetworks = selectNetworks(state)
    const bridgeAppConfig = selectBridgeAppConfig(state)
    const { currentBlockchain, amountStr, asset, maxFeePerGas } = result.data
    const denomination = asset.denomination

    const amount = bnToBig(stringToBN(amountStr, denomination), denomination)

    try {
      const txn = await BridgeService.transferAsset({
        currentBlockchain,
        amount,
        asset,
        config: bridgeAppConfig,
        activeAccount,
        allNetworks,
        isTestnet: isDeveloperMode,
        maxFeePerGas
      })
      if (!txn) {
        throw Error('transaction not found')
      }
      return { success: true, value: txn }
    } catch (e) {
      Logger.error('Unable to transfer asset', e)

      const error = ethErrors.rpc.internal<string>('Unable to transfer asset')

      Sentry.captureException(e, { tags: { dapps: 'bridgeAssetV2' } })

      return {
        success: false,
        error
      }
    }
  }
}

export const avalancheBridgeAssetHandler = new AvalancheBridgeAssetHandler()
