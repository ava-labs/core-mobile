import { AppListenerEffectAPI } from 'store/types'
import { selectActiveAccount } from 'store/account'
import walletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { PubKeyType } from 'services/wallet/types'
import { selectActiveWallet } from 'store/wallet/slice'
import { HandleResponse, RpcRequestHandler } from '../types'

export type AvalancheGetAccountPubKeyRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY>

class AvalancheGetAccountPubKeyHandler
  implements RpcRequestHandler<AvalancheGetAccountPubKeyRpcRequest, PubKeyType>
{
  methods = [RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY]

  handle = async (
    _request: AvalancheGetAccountPubKeyRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<PubKeyType> => {
    const activeAccount = selectActiveAccount(listenerApi.getState())
    const activeWallet = selectActiveWallet(listenerApi.getState())

    if (!activeAccount || !activeWallet) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Active account does not exist')
      }
    }

    const publicKey = await walletService.getPublicKey(
      activeWallet.id,
      activeWallet.type,
      activeAccount
    )

    return { success: true, value: publicKey }
  }
}

export const avalancheGetAccountPubKeyHandler =
  new AvalancheGetAccountPubKeyHandler()
