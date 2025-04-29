// TODO: fix bridgeAsset
// import * as Sentry from '@sentry/react-native'
// import { AppListenerEffectAPI } from 'store'
// import { rpcErrors } from '@metamask/rpc-errors'
// import BridgeService from 'services/bridge/BridgeService'
// import { noop } from '@avalabs/core-utils-sdk'
// import { selectActiveAccount } from 'store/account/slice'
// import Logger from 'utils/Logger'
// import { selectBridgeAppConfig } from 'store/bridge/slice'
// import * as Navigation from 'utils/Navigation'
// import AppNavigation from 'navigation/AppNavigation'
// import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
// import { Blockchain, Asset } from '@avalabs/core-bridge-sdk'
// import { selectNetworks } from 'store/network/slice'
// import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
// import { RpcMethod, RpcRequest } from '../../types'
// import {
//   ApproveResponse,
//   DEFERRED_RESULT,
//   HandleResponse,
//   RpcRequestHandler
// } from '../types'
// import { parseApproveData, parseRequestParams } from './utils'

// const convertToSatoshis = (btcString: string): number => {
//   return Math.round(parseFloat(btcString) * 100000000)
// }

// export type AvalancheBridgeAssetRequest =
//   RpcRequest<RpcMethod.AVALANCHE_BRIDGE_ASSET>

// class AvalancheBridgeAssetHandler
//   implements RpcRequestHandler<AvalancheBridgeAssetRequest>
// {
//   methods = [RpcMethod.AVALANCHE_BRIDGE_ASSET]

//   handle = async (request: AvalancheBridgeAssetRequest): HandleResponse => {
//     const { params } = request.data.params.request
//     const result = parseRequestParams(params)

//     if (!result.success) {
//       Logger.error('invalid params', result.error)
//       return {
//         success: false,
//         error: rpcErrors.invalidParams('Params are invalid')
//       }
//     }

//     const [currentBlockchain, amountStr, asset] = result.data

//     Navigation.navigate({
//       name: AppNavigation.Root.Wallet,
//       params: {
//         screen: AppNavigation.Modal.BridgeAssetV2,
//         params: {
//           request,
//           amountStr,
//           asset: asset as Asset,
//           currentBlockchain
//         }
//       }
//     })

//     return { success: true, value: DEFERRED_RESULT }
//   }

//   approve = async (
//     payload: { request: AvalancheBridgeAssetRequest; data?: unknown },
//     listenerApi: AppListenerEffectAPI
//   ): ApproveResponse => {
//     const result = parseApproveData(payload.data)

//     if (!result.success) {
//       return {
//         success: false,
//         error: rpcErrors.internal('Invalid approve data')
//       }
//     }

//     const state = listenerApi.getState()
//     const isDeveloperMode = selectIsDeveloperMode(state)
//     const activeAccount = selectActiveAccount(state)
//     const allNetworks = selectNetworks(state)
//     const bridgeAppConfig = selectBridgeAppConfig(state)
//     const request = createInAppRequest(listenerApi.dispatch)

//     const { currentBlockchain, amountStr, asset, maxFeePerGas } = result.data

//     if (!activeAccount) {
//       return {
//         success: false,
//         error: rpcErrors.internal('No active account')
//       }
//     }

//     if (!bridgeAppConfig) {
//       return {
//         success: false,
//         error: rpcErrors.internal('Invalid bridge config')
//       }
//     }

//     if (currentBlockchain === Blockchain.UNKNOWN) {
//       return {
//         success: false,
//         error: rpcErrors.internal('Invalid blockchain')
//       }
//     }

//     try {
//       let txHash

//       if (currentBlockchain === Blockchain.BITCOIN) {
//         txHash = await BridgeService.transferBTC({
//           fromAccount: activeAccount.addressBTC,
//           amount: convertToSatoshis(amountStr),
//           config: bridgeAppConfig,
//           feeRate: Number(maxFeePerGas),
//           isMainnet: !isDeveloperMode,
//           onStatusChange: noop,
//           onTxHashChange: noop,
//           request
//         })
//       } else {
//         txHash = await BridgeService.transferEVM({
//           currentBlockchain,
//           amount: amountStr,
//           asset: asset as Asset,
//           config: bridgeAppConfig,
//           activeAccount,
//           allNetworks,
//           isTestnet: isDeveloperMode,
//           onStatusChange: noop,
//           onTxHashChange: noop,
//           request
//         })
//       }

//       return { success: true, value: { hash: txHash } }
//     } catch (e) {
//       Logger.error('Unable to transfer asset', e)

//       const error = rpcErrors.internal({
//         message: 'Unable to transfer asset',
//         data: { cause: e }
//       })

//       Sentry.captureException(e, { tags: { dapps: 'bridgeAssetV2' } })

//       return {
//         success: false,
//         error
//       }
//     }
//   }
// }

// export const avalancheBridgeAssetHandler = new AvalancheBridgeAssetHandler()
