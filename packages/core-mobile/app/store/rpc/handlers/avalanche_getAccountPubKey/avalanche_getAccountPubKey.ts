import { AppListenerEffectAPI } from 'store/types'
import { selectActiveAccount } from 'store/account'
import walletService from 'services/wallet/WalletService'
import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { PubKeyType } from 'services/wallet/types'
import { selectActiveWallet } from 'store/wallet/slice'
import {
  getAccountScope,
  isAccountInSession
} from 'store/rpc/utils/sessionAccountScope/sessionAccountScope'
import { HandleResponse, RpcRequestHandler } from '../types'

export type AvalancheGetAccountPubKeyRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY>

class AvalancheGetAccountPubKeyHandler
  implements RpcRequestHandler<AvalancheGetAccountPubKeyRpcRequest, PubKeyType>
{
  methods = [RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY]

  handle = async (
    request: AvalancheGetAccountPubKeyRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<PubKeyType> => {
    const state = listenerApi.getState()
    const activeAccount = selectActiveAccount(state)
    const activeWallet = selectActiveWallet(state)

    if (!activeAccount || !activeWallet) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Active account does not exist')
      }
    }

    const scope = getAccountScope(request)
    if (
      scope.kind === 'denied' ||
      (scope.kind === 'session' &&
        !isAccountInSession(activeAccount, scope.namespaces))
    ) {
      return {
        success: false,
        error: providerErrors.unauthorized(
          'The active account is not approved for this session'
        )
      }
    }

    const publicKey = await walletService.getPublicKey(
      activeWallet.id,
      activeWallet.type,
      activeAccount.index
    )

    return { success: true, value: publicKey }
  }
}

export const avalancheGetAccountPubKeyHandler =
  new AvalancheGetAccountPubKeyHandler()
