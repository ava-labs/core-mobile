import { PayloadAction } from '@reduxjs/toolkit'
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
import {
  addRequest,
  onSendRpcResult,
  onSendRpcError,
  removeRequest,
  updateRequest
} from '../slice'
import { RpcMethod } from '../types'
import { DappRpcRequest, RpcRequestHandler } from './types'

export interface AvalancheBridgeAssetRequest
  extends DappRpcRequest<
    RpcMethod.AVALANCHE_BRIDGE_ASSET,
    [Blockchain, string, Asset]
  > {
  data: { amountStr: string; asset: Asset; currentBlockchain: Blockchain }
  result?: string
  error?: Error
}

class AvalancheBridgeAssetHandler
  implements RpcRequestHandler<AvalancheBridgeAssetRequest>
{
  methods = [RpcMethod.AVALANCHE_BRIDGE_ASSET]

  handle = async (
    action: PayloadAction<AvalancheBridgeAssetRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
    const { params } = action.payload

    const [currentBlockchain, amountStr, asset] = params

    if (!currentBlockchain || !amountStr || !asset) {
      dispatch(
        onSendRpcError({
          request: action,
          error: ethErrors.rpc.invalidParams({
            message: 'Params are missing'
          })
        })
      )
      return
    }

    const dAppRequest: AvalancheBridgeAssetRequest = {
      payload: action.payload,
      data: { amountStr, asset, currentBlockchain }
    }

    dispatch(addRequest(dAppRequest))
  }

  approve = async (
    action: PayloadAction<{ request: AvalancheBridgeAssetRequest }, string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { getState, dispatch } = listenerApi
    const activeAccount = selectActiveAccount(getState())
    const allNetworks = selectNetworks(getState())
    const activeNetwork = selectActiveNetwork(getState())
    const bridgeAppConfig = selectBridgeAppConfig(getState())
    const request = action.payload.request
    const {
      data: { currentBlockchain, amountStr, asset }
    } = request
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

      if (!result) throw new Error('failed to transfer asset')

      dispatch(
        updateRequest({
          ...request,
          result: result.hash
        })
      )

      dispatch(
        onSendRpcResult({
          request,
          result
        })
      )

      dispatch(removeRequest(request.payload.id))
    } catch (error) {
      if (error instanceof Error) {
        Logger.error('Error approving dapp tx', error)

        dispatch(
          updateRequest({
            ...request,
            error
          })
        )

        dispatch(
          onSendRpcError({
            request,
            error: ethErrors.rpc.internal(
              'failed to approve transaction request'
            )
          })
        )

        Sentry.captureException(error, { tags: { dapps: 'bridgeAsset' } })
      }
    }
  }
}

export const avalancheBridgeAssetHandler = new AvalancheBridgeAssetHandler()
