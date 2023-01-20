import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { PayloadAction } from '@reduxjs/toolkit'
import { ethErrors } from 'eth-rpc-errors'
import { isValidRPCUrl } from 'services/network/utils/isValidRpcUrl'
import { AppListenerEffectAPI } from 'store'
import {
  addCustomNetwork,
  selectActiveNetwork,
  selectNetworks,
  setActive
} from 'store/network'
import { RpcMethod } from '../types'
import {
  addRequest,
  removeRequest,
  onSendRpcError,
  onSendRpcResult
} from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'

interface AddEthereumChainParameter {
  chainId: string
  blockExplorerUrls?: string[]
  chainName?: string
  iconUrls?: string[]
  nativeCurrency?: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls?: string[]
}

export interface WalletAddEthereumChainRpcRequest
  extends DappRpcRequest<
    RpcMethod.WALLET_ADD_ETHEREUM_CHAIN,
    AddEthereumChainParameter[]
  > {
  network: Network
  isExisting: boolean
}

class WalletAddEthereumChainHandler
  implements RpcRequestHandler<WalletAddEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_ADD_ETHEREUM_CHAIN]

  handle = async (
    action: PayloadAction<WalletAddEthereumChainRpcRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
    const store = listenerApi.getState()

    const requestedChain: AddEthereumChainParameter | undefined =
      action.payload.params?.[0]

    if (!requestedChain) {
      dispatch(
        onSendRpcError({
          request: { payload: action.payload },
          error: ethErrors.rpc.invalidParams({
            message: 'missing chain params'
          })
        })
      )
      return
    }

    const chains = selectNetworks(store)
    const currentActiveNetwork = selectActiveNetwork(store)
    const supportedChainIds = Object.keys(chains ?? {})
    const requestedChainId = Number(requestedChain.chainId)
    const chainRequestedIsSupported =
      requestedChain && supportedChainIds.includes(requestedChainId.toString())
    const isSameNetwork = requestedChainId === currentActiveNetwork?.chainId

    if (isSameNetwork) {
      dispatch(
        onSendRpcResult({
          request: { payload: action.payload },
          result: null
        })
      )
      return
    }

    const rpcUrl = requestedChain?.rpcUrls?.[0]
    if (!rpcUrl) {
      dispatch(
        onSendRpcError({
          request: { payload: action.payload },
          error: ethErrors.rpc.invalidParams({
            message: 'RPC url missing'
          })
        })
      )
      return
    }

    if (!requestedChain.nativeCurrency) {
      dispatch(
        onSendRpcError({
          request: { payload: action.payload },
          error: ethErrors.rpc.invalidParams({
            message: 'Expected nativeCurrency param to be defined'
          })
        })
      )
      return
    }

    const customNetwork: Network = {
      chainId: requestedChainId,
      chainName: requestedChain.chainName || '',
      description: '',
      explorerUrl: requestedChain.blockExplorerUrls?.[0] || '',
      isTestnet: false,
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
      vmName: NetworkVMType.EVM
    }

    if (chainRequestedIsSupported) {
      dispatch(
        addRequest({
          payload: action.payload,
          network: customNetwork,
          isExisting: true
        })
      )
      return
    }

    const isValid = await isValidRPCUrl(
      customNetwork.chainId,
      customNetwork.rpcUrl
    )
    if (!isValid) {
      dispatch(
        onSendRpcError({
          request: { payload: action.payload },
          error: ethErrors.rpc.invalidParams({
            message: 'ChainID does not match the rpc url'
          })
        })
      )
      return
    }
    dispatch(
      addRequest({
        payload: action.payload,
        network: customNetwork,
        isExisting: false
      })
    )
  }

  approve = async (
    action: PayloadAction<
      { request: WalletAddEthereumChainRpcRequest },
      string
    >,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
    const request = action.payload.request

    if (!action.payload.request.isExisting) {
      dispatch(addCustomNetwork(request.network))
    }

    dispatch(setActive(request.network.chainId))
    dispatch(removeRequest(request.payload.id))
    dispatch(onSendRpcResult({ request }))
  }
}
export const walletAddEthereumChainHandler = new WalletAddEthereumChainHandler()
