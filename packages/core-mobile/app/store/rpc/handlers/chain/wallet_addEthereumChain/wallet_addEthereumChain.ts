import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { rpcErrors } from '@metamask/rpc-errors'
import { isValidRPCUrl } from 'services/network/utils/isValidRpcUrl'
import { AppListenerEffectAPI } from 'store/types'
import {
  addCustomNetwork,
  selectAllNetworks,
  toggleEnabledChainId
} from 'store/network/slice'
import { router } from 'expo-router'
import Logger from 'utils/Logger'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type WalletAddEthereumChainRpcRequest =
  RpcRequest<RpcMethod.WALLET_ADD_ETHEREUM_CHAIN>

class WalletAddEthereumChainHandler
  implements RpcRequestHandler<WalletAddEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_ADD_ETHEREUM_CHAIN]

  handle = async (
    request: WalletAddEthereumChainRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const state = listenerApi.getState()
    const { params } = request.data.params.request
    const result = parseRequestParams(params)
    const isDeveloperMode = selectIsDeveloperMode(state)
    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams('Chain info is invalid')
      }
    }

    const requestedChain = result.data[0]

    const chains = selectAllNetworks(state)
    const requestedChainId = Number(requestedChain.chainId)

    const rpcUrl = requestedChain.rpcUrls?.[0]
    if (!rpcUrl) {
      return {
        success: false,
        error: rpcErrors.invalidParams('RPC url is missing')
      }
    }

    if (!requestedChain.nativeCurrency) {
      return {
        success: false,
        error: rpcErrors.invalidParams(
          'Expected nativeCurrency param to be defined'
        )
      }
    }

    const supportedChainIds = Object.keys(chains ?? {})
    const chainAlreadyExists =
      requestedChain && supportedChainIds.includes(requestedChainId.toString())

    if (chainAlreadyExists) {
      return { success: true, value: null }
    }

    // use the requested chain's isTestnet value or fall back to the current developer mode
    const isTestnet =
      requestedChain.isTestnet !== undefined
        ? requestedChain.isTestnet
        : isDeveloperMode

    const customNetwork: Network = {
      chainId: requestedChainId,
      chainName: requestedChain.chainName || '',
      description: '',
      explorerUrl: requestedChain.blockExplorerUrls?.[0] || '',
      isTestnet,
      logoUri: requestedChain.iconUrls?.[0] || '',
      mainnetChainId: 0,
      networkToken: {
        symbol: requestedChain.nativeCurrency.symbol,
        name: requestedChain.nativeCurrency.name,
        description: '',
        decimals: requestedChain.nativeCurrency.decimals,
        logoUri: requestedChain.iconUrls?.[0] || ''
      },
      platformChainId: '',
      rpcUrl,
      subnetId: '',
      vmId: '',
      primaryColor: '',
      vmName: NetworkVMType.EVM
    }

    const isValid = await isValidRPCUrl(
      customNetwork.chainId,
      customNetwork.rpcUrl
    )
    if (!isValid) {
      return {
        success: false,
        error: rpcErrors.invalidParams('ChainID does not match the rpc url')
      }
    }

    walletConnectCache.addEthereumChainParams.set({
      request,
      network: customNetwork
    })

    // @ts-ignore TODO: make routes typesafe
    router.navigate('/addEthereumChain')
    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: WalletAddEthereumChainRpcRequest; data?: unknown },
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

    dispatch(addCustomNetwork(data.network))
    dispatch(toggleEnabledChainId(data.network.chainId))

    const state = getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    // validate network against the current developer mode
    const isTestnet = Boolean(data.network?.isTestnet)

    // switch to correct dev mode
    if (isTestnet !== isDeveloperMode) {
      dispatch(toggleDeveloperMode())
    }

    return { success: true, value: null }
  }
}

export const walletAddEthereumChainHandler = new WalletAddEthereumChainHandler()
