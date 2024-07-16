import { AppListenerEffectAPI } from 'store'
import { rpcErrors } from '@metamask/rpc-errors'
import {
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type AvalancheSelectAccountRequest =
  RpcRequest<RpcMethod.AVALANCHE_SELECT_ACCOUNT>

class AvalancheSelectAccountHandler
  implements RpcRequestHandler<AvalancheSelectAccountRequest>
{
  methods = [RpcMethod.AVALANCHE_SELECT_ACCOUNT]

  handle = async (
    request: AvalancheSelectAccountRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
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

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.SelectAccountV2,
        params: {
          request,
          account: requestedAccount
        }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: AvalancheSelectAccountRequest; data?: unknown },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: rpcErrors.internal('Invalid approve data')
      }
    }

    const accountIndex = result.data.account.index

    dispatch(setActiveAccountIndex(accountIndex))

    return { success: true, value: [] }
  }
}

export const avalancheSelectAccountHandler = new AvalancheSelectAccountHandler()
