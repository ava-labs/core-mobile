import { Network } from '@avalabs/chains-sdk'
import { PayloadAction } from '@reduxjs/toolkit'
import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { selectActiveNetwork, selectNetworks, setActive } from 'store/network'
import {
  addRequest,
  removeRequest,
  sendRpcError,
  sendRpcResult
} from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'

export interface WalletSwitchEthereumChainRpcRequest
  extends DappRpcRequest<
    RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN,
    { chainId: string }[]
  > {
  network: Network
}

class WalletSwitchEthereumChainHandler
  implements RpcRequestHandler<WalletSwitchEthereumChainRpcRequest>
{
  methods = [RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN]

  handle = async (
    action: PayloadAction<
      WalletSwitchEthereumChainRpcRequest['payload'],
      string
    >,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
    const store = listenerApi.getState()

    const params = action.payload.params
    const targetChainID = params?.[0]?.chainId // chain ID is hex with 0x perfix
    const networks = selectNetworks(store)
    const supportedNetwork = networks[Number(targetChainID)]
    const currentActiveNetwork = selectActiveNetwork(store)

    // Verify if the wallet is not currently on the requested network.
    // If it is, we just need to return early to prevent an unnecessary UX
    if (Number(targetChainID) === currentActiveNetwork?.chainId) {
      dispatch(
        sendRpcResult({
          request: { payload: action.payload },
          result: null
        })
      )
      return
    }
    // If the network is not currently on the requested network and we currently support the network
    // then we need to show a confirmation popup to confirm user wants to switch to the requested network
    // from the dApp they are on.
    if (supportedNetwork?.chainId) {
      dispatch(
        addRequest({
          payload: action.payload,
          network: supportedNetwork
        })
      )
      return
    } else {
      dispatch(
        sendRpcError({
          request: { payload: action.payload },
          error: ethErrors.provider.custom({
            code: 4902, // To-be-standardized "unrecognized chain ID" error
            message: `Unrecognized chain ID "${targetChainID}". Try adding the chain using ${RpcMethod.WALLET_ADD_ETHEREUM_CHAIN} first.`
          })
        })
      )
      return
    }
  }

  onApprove = async (
    action: PayloadAction<
      { request: WalletSwitchEthereumChainRpcRequest },
      string
    >,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
    const request = action.payload.request

    dispatch(setActive(request.network.chainId))
    dispatch(removeRequest(request.payload.id))
    dispatch(sendRpcResult({ request }))
  }
}
export const walletSwitchEthereumChainHandler =
  new WalletSwitchEthereumChainHandler()
