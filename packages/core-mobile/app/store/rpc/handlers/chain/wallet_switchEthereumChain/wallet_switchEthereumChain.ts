import { rpcErrors, providerErrors } from '@metamask/rpc-errors'
import { AppListenerEffectAPI } from 'store'
import {
  selectActiveNetwork,
  selectAllNetworks,
  setActive
} from 'store/network'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type WalletSwitchEthereumChainRpcRequest =
  RpcRequest<RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN>

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
        error: rpcErrors.invalidParams('Chain ID is invalid')
      }
    }

    const targetChainIDInHex = result.data[0].chainId // chain ID is hex with 0x prefix
    const targetChainID = Number(targetChainIDInHex)
    const networks = selectAllNetworks(store)

    const supportedNetwork = networks[Number(targetChainID)]
    const currentActiveNetwork = selectActiveNetwork(store)
    const isNotSupportedChain = isNaN(Number(targetChainID))

    // 1. Verify if the wallet is currently on the requested network.
    // 2. Veirfy if the targetChainID is NaN,
    //    which means it is not a supported chain on ethereum network (e.g. Avalanche X and P Chains)
    // If one of them is true, we just need to return early to prevent an unnecessary UX
    if (
      Number(targetChainID) === currentActiveNetwork?.chainId ||
      isNotSupportedChain
    ) {
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
        error: providerErrors.custom({
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
        error: rpcErrors.internal('Invalid approve data')
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
