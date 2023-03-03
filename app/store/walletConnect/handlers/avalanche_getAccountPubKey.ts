import { AppListenerEffectAPI } from 'store'
import { selectActiveAccount } from 'store/account'
import walletService from 'services/wallet/WalletService'
import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod } from 'store/walletConnectV2'
import { DappRpcRequest, HandleResponse, RpcRequestHandler } from './types'

export type AvalancheGetAccountPubKeyRpcRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY,
  []
>

class AvalancheGetAccountPubKeyHandler
  implements RpcRequestHandler<AvalancheGetAccountPubKeyRpcRequest, never>
{
  methods = [RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY]

  handle = async (
    request: AvalancheGetAccountPubKeyRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const activeAccount = selectActiveAccount(listenerApi.getState())
    if (!activeAccount) {
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound({
          message: 'Active account does not exist'
        })
      }
    }

    const publicKey = await walletService.getPublicKey(activeAccount)

    return { success: true, value: publicKey }
  }
}

export const avalancheGetAccountPubKeyHandler =
  new AvalancheGetAccountPubKeyHandler()
