import * as Sentry from '@sentry/react-native'
import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import { Asset, Blockchain } from '@avalabs/bridge-sdk'
import BridgeService from 'services/bridge/BridgeService'
import { bnToBig, stringToBN } from '@avalabs/utils-sdk'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork, selectNetworks } from 'store/network'
import Logger from 'utils/Logger'
import { selectBridgeAppConfig } from 'store/bridge'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { updateRequestStatus } from '../slice'
import { RpcMethod } from '../types'
import {
  ApproveResponse,
  DappRpcRequest,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from './types'

type ApproveData = {
  amountStr: string
  asset: Asset
  currentBlockchain: Blockchain
}

export type AvalancheBridgeAssetRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_BRIDGE_ASSET,
  [Blockchain, string, Asset]
>

class AvalancheBridgeAssetHandler
  implements RpcRequestHandler<AvalancheBridgeAssetRequest, ApproveData>
{
  methods = [RpcMethod.AVALANCHE_BRIDGE_ASSET]

  handle = async (request: AvalancheBridgeAssetRequest): HandleResponse => {
    const { params } = request.payload

    const [currentBlockchain, amountStr, asset] = params

    if (!currentBlockchain || !amountStr || !asset) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Params are missing'
        })
      }
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.BridgeAsset,
        params: { request, amountStr, asset, currentBlockchain }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: AvalancheBridgeAssetRequest; data: ApproveData },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { getState, dispatch } = listenerApi
    const activeAccount = selectActiveAccount(getState())
    const allNetworks = selectNetworks(getState())
    const activeNetwork = selectActiveNetwork(getState())
    const bridgeAppConfig = selectBridgeAppConfig(getState())
    const request = payload.request
    const { currentBlockchain, amountStr, asset } = payload.data
    const denomination = asset.denomination
    const amount = bnToBig(stringToBN(amountStr, denomination), denomination)

    try {
      const result = await BridgeService.transferAsset({
        currentBlockchain,
        amount,
        asset,
        config: bridgeAppConfig,
        activeAccount,
        allNetworks,
        activeNetwork
      })

      if (!result) {
        return {
          success: false,
          error: ethErrors.rpc.internal('failed to transfer asset')
        }
      }

      dispatch(
        updateRequestStatus({
          id: request.payload.id,
          status: {
            result: result.hash
          }
        })
      )

      return { success: true, value: result }
    } catch (e) {
      Logger.error('Error approving dapp tx', e)

      const error = ethErrors.rpc.internal<string>('failed to transfer asset')

      dispatch(
        updateRequestStatus({
          id: request.payload.id,
          status: {
            error
          }
        })
      )

      Sentry.captureException(e, { tags: { dapps: 'bridgeAsset' } })

      return {
        success: false,
        error
      }
    }
  }
}

export const avalancheBridgeAssetHandler = new AvalancheBridgeAssetHandler()
