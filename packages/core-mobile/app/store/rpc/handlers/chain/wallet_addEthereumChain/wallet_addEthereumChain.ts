import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { rpcErrors } from '@metamask/rpc-errors'
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
import { validateCustomRpcUrl } from 'services/network/utils/validateCustomRpcUrl'
import { isValidRPCUrl } from 'services/network/utils/isValidRpcUrl'
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

    // Synchronous safety checks on the URL (HTTPS, no localhost, no private
    // IPs) — only for chains we are about to ADD. A request for an
    // already-known chainId short-circuits above and keeps its trusted
    // config regardless of the (possibly imperfect) URL the dApp supplied,
    // matching the prior behavior. The async chainId probe is deferred until
    // after user approval because dApps like Aave time out waiting for an
    // approval modal if we block on a network call here.
    const urlCheck = validateCustomRpcUrl(rpcUrl)
    if (!urlCheck.ok) {
      return {
        success: false,
        error: rpcErrors.invalidParams(urlCheck.reason)
      }
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

    walletConnectCache.addEthereumChainParams.set({
      request,
      network: customNetwork
    })

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

    // Probe the RPC URL once the user has approved — rejects if the URL
    // fails to respond to eth_chainId or reports a different chainId than
    // the dApp claimed. Closes the attack where a malicious site lists a
    // trusted chainId but points at attacker-controlled infra.
    const probeOk = await isValidRPCUrl(
      data.network.chainId,
      data.network.rpcUrl
    )
    if (!probeOk) {
      return {
        success: false,
        error: rpcErrors.invalidParams(
          `RPC URL did not report chainId ${data.network.chainId}`
        )
      }
    }

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
