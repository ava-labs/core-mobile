import { ethErrors } from 'eth-rpc-errors'
import { AppListenerEffectAPI } from 'store'
import { setActive } from 'store/network'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { getActiveNetworkFromCache } from 'utils/networkFromCache/getActiveNetworkFromCache'
import { getAllNetworksFromCache } from 'utils/networkFromCache/getAllNetworksFromCache'
import { RpcMethod, SessionRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type WalletSwitchEthereumChainRpcRequest =
  SessionRequest<RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN>

class WalletSwitchEthereumChainHandler
  implements RpcRequestHandler<WalletSwitchEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN]

  handle = async (
    request: WalletSwitchEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const store = listenerApi.getState()

    const { params } = request.data.params.request
    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Chain ID is invalid'
        })
      }
    }

    const targetChainIDInHex = result.data[0].chainId // chain ID is hex with 0x prefix
    const targetChainID = Number(targetChainIDInHex)
    const networks = getAllNetworksFromCache(store)

    const supportedNetwork = networks[Number(targetChainID)]
    const currentActiveNetwork = getActiveNetworkFromCache(store)

    // Verify if the wallet is not currently on the requested network.
    // If it is, we just need to return early to prevent an unnecessary UX
    if (Number(targetChainID) === currentActiveNetwork?.chainId) {
      return { success: true, value: null }
    }

    // If the network is not currently on the requested network and we currently support the network
    // then we need to show a confirmation popup to confirm user wants to switch to the requested network
    // from the dApp they are on.
    if (supportedNetwork?.chainId) {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.SwitchEthereumChainV2,
          params: { request, network: supportedNetwork }
        }
      })

      return { success: true, value: DEFERRED_RESULT }
    } else {
      return {
        success: false,
        error: ethErrors.provider.custom({
          code: 4902, // To-be-standardized "unrecognized chain ID" error
          message: `Unrecognized chain ID "${targetChainID}". Try adding the chain using ${RpcMethod.WALLET_ADD_ETHEREUM_CHAIN} first.`
        })
      }
    }
  }

  approve = async (
    payload: {
      request: WalletSwitchEthereumChainRpcRequest
      data?: unknown
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch, getState } = listenerApi

    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: ethErrors.rpc.internal('Invalid approve data')
      }
    }

    const data = result.data
    const state = getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    // validate network against the current developer mode
    const chainId = data.network.chainId
    const isTestnet = Boolean(data.network?.isTestnet)

    // switch to correct dev mode
    if (isTestnet !== isDeveloperMode) {
      dispatch(toggleDeveloperMode())
    }

    dispatch(setActive(chainId))

    return { success: true, value: null }
  }
}

export const walletSwitchEthereumChainHandler =
  new WalletSwitchEthereumChainHandler()
