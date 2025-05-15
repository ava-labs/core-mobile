import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { selectAccountByUuid, setAccountTitle } from 'store/account/slice'
import Logger from 'utils/Logger'
import { selectWalletById } from 'store/wallet/slice'
import { RpcMethod, RpcRequest } from '../../../types'
import { HandleResponse, RpcRequestHandler } from '../../types'
import { parseRequestParams } from './utils'

type AvalancheRenameAccountRequest =
  RpcRequest<RpcMethod.AVALANCHE_RENAME_ACCOUNT>

class AvalancheRenameAccountHandler
  implements RpcRequestHandler<AvalancheRenameAccountRequest>
{
  methods = [RpcMethod.AVALANCHE_RENAME_ACCOUNT]

  handle = async (
    request: AvalancheRenameAccountRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState, dispatch } = listenerApi
    const { params } = request.data.params.request

    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams('Account id is invalid')
      }
    }

    const accountId = result.data[0]
    const title = result.data[1]

    const requestedAccount = selectAccountByUuid(accountId)(getState())
    if (!requestedAccount) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Requested account does not exist')
      }
    }

    if (title.trim().length === 0) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Invalid new name')
      }
    }

    const wallet = selectWalletById(requestedAccount.walletId)(getState())
    if (!wallet) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Requested wallet does not exist')
      }
    }

    try {
      dispatch(
        setAccountTitle({
          accountId: requestedAccount.id,
          title,
          walletType: wallet.type
        })
      )
    } catch (error) {
      Logger.error('Account renaming failed', error)
      return {
        success: false,
        error: rpcErrors.internal('Account renaming failed')
      }
    }

    return { success: true, value: [] }
  }
}

export const avalancheRenameAccountHandler = new AvalancheRenameAccountHandler()
