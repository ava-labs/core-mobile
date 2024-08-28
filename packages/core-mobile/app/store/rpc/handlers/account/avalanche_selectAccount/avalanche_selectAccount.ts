import { AppListenerEffectAPI } from 'store'
import { rpcErrors } from '@metamask/rpc-errors'
import {
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account/slice'
import Logger from 'utils/Logger'
import { RpcMethod, RpcRequest } from '../../../types'
import { HandleResponse, RpcRequestHandler } from '../../types'
import { parseRequestParams } from './utils'

type AvalancheSelectAccountRequest =
  RpcRequest<RpcMethod.AVALANCHE_SELECT_ACCOUNT>

class AvalancheSelectAccountHandler
  implements RpcRequestHandler<AvalancheSelectAccountRequest>
{
  methods = [RpcMethod.AVALANCHE_SELECT_ACCOUNT]

  handle = async (
    request: AvalancheSelectAccountRequest,
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

    const activeAccount = selectActiveAccount(getState())
    const accounts = selectAccounts(getState())

    const accountAlreadyActive = activeAccount && activeAccount.id === accountId

    if (accountAlreadyActive) {
      return { success: true, value: null }
    }

    const requestedAccount = Object.values(accounts).find(
      account => account.id === accountId
    )

    if (requestedAccount === undefined) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Requested account does not exist')
      }
    }

    dispatch(setActiveAccountIndex(requestedAccount.index))

    return { success: true, value: [] }
  }
}

export const avalancheSelectAccountHandler = new AvalancheSelectAccountHandler()
