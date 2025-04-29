import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { selectAccounts, setAccountTitle } from 'store/account/slice'
import Logger from 'utils/Logger'
import { WalletType as AvalabsWalletType } from '@avalabs/types'
import { WalletType } from 'services/wallet/types'
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

    const accounts = selectAccounts(getState())
    const requestedAccount = Object.values(accounts).find(
      account => account.id === accountId
    )

    if (title.trim().length === 0) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Invalid new name')
      }
    }

    if (requestedAccount === undefined) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Requested account does not exist')
      }
    }

    let walletType: WalletType
    if (requestedAccount.walletType === AvalabsWalletType.Mnemonic) {
      walletType = WalletType.MNEMONIC
    } else if (requestedAccount.walletType === AvalabsWalletType.Seedless) {
      walletType = WalletType.SEEDLESS
    } else {
      return {
        success: false,
        error: rpcErrors.internal(
          'Wallet type not supported: ' + requestedAccount.walletType
        )
      }
    }

    try {
      dispatch(
        setAccountTitle({
          accountIndex: requestedAccount.index,
          title,
          walletType
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
