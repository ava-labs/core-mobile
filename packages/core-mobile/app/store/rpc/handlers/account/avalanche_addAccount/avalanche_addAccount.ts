import { AppListenerEffectAPI } from 'store/types'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { addAccount } from 'store/account/thunks'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectWalletById } from 'store/wallet/slice'
import {
  selectAccountsByWalletId,
  selectActiveAccount
} from 'store/account/slice'
import { CoreAccountType } from '@avalabs/types'
import { Account, PrimaryAccount } from 'store/account'
import { HandleResponse, RpcRequestHandler } from '../../types'
import { parseRequestParams } from './util'

export type AvalancheAddAccountRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_ADD_ACCOUNT>

class AvalancheAddAccountHandler
  implements RpcRequestHandler<AvalancheAddAccountRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_ADD_ACCOUNT]

  handle = async (
    request: AvalancheAddAccountRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<string> => {
    const { dispatch, getState } = listenerApi
    const state = getState()
    const activeAccount = selectActiveAccount(state)

    const result = parseRequestParams(request.data.params.request.params)
    if (!result.success) {
      return {
        success: false,
        error: rpcErrors.invalidParams('invalid params')
      }
    }

    const _walletId = result.data[0]
    const walletId = _walletId
      ? _walletId
      : isPrimaryAccount(activeAccount)
      ? activeAccount.walletId
      : undefined

    const selectedWallet = selectWalletById(walletId ?? '')(state)

    if (!selectedWallet || !walletId) {
      Logger.error('avalanche_addAccount: wallet not found')
      return {
        success: false,
        error: rpcErrors.invalidParams('wallet not found')
      }
    }

    const previousAccountCount = selectAccountsByWalletId(
      state,
      walletId
    ).length

    await dispatch(addAccount(walletId)).unwrap()
    AnalyticsService.capture('CreatedANewAccountSuccessfully', {
      walletType: selectedWallet.type
    })

    const newState = listenerApi.getState()
    const currentAccountCount = selectAccountsByWalletId(
      newState,
      walletId
    ).length

    if (currentAccountCount <= previousAccountCount) {
      Logger.error('avalanche_addAccount: no new account created')
      return {
        success: false,
        error: rpcErrors.invalidParams('no new account created')
      }
    }

    const newActiveAccount = selectActiveAccount(newState)

    return { success: true, value: newActiveAccount?.id ?? '' }
  }
}

export const isPrimaryAccount = (
  account?: Pick<Account, 'type'>
): account is PrimaryAccount => account?.type === CoreAccountType.PRIMARY

export const avalancheAddAccountHandler = new AvalancheAddAccountHandler()
