import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import {
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { RpcMethod, SessionRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type AvalancheSelectAccountRequest =
  SessionRequest<RpcMethod.AVALANCHE_SELECT_ACCOUNT>

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
        error: ethErrors.rpc.invalidParams({
          message: 'Account index is invalid'
        })
      }
    }

    const accountIndex = result.data[0]

    const activeAccount = selectActiveAccount(getState())
    const accounts = selectAccounts(getState())

    const accountAlreadyActive =
      activeAccount && activeAccount.index === accountIndex

    if (accountAlreadyActive) {
      return { success: true, value: null }
    }

    const requestedAccount = accounts[accountIndex]

    if (requestedAccount === undefined) {
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound({
          message: 'Requested account does not exist'
        })
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
        error: ethErrors.rpc.internal('Invalid approve data')
      }
    }

    const accountIndex = result.data.account.index

    dispatch(setActiveAccountIndex(accountIndex))

    return { success: true, value: [] }
  }
}

export const avalancheSelectAccountHandler = new AvalancheSelectAccountHandler()
