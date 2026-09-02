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

const FALLBACK_ADD_ACCOUNT_ERROR_MESSAGE = 'Failed to add account'

// createAsyncThunk's unwrap() throws RTK's miniSerializeError output (a
// plain { name?, message?, stack?, code? } object) rather than a real Error
// instance, since `addAccount` doesn't use rejectWithValue — so this can't
// check `error instanceof Error` to recover the dapp-facing message.
const extractAddAccountErrorMessage = (error: unknown): string => {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
      ? (error as { message: string }).message
      : ''

  // An empty/whitespace-only message is as useless to the dapp as a missing
  // one — fall back to the generic string rather than surfacing blank text.
  return message.trim().length > 0
    ? message
    : FALLBACK_ADD_ACCOUNT_ERROR_MESSAGE
}

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

    try {
      await dispatch(addAccount(walletId)).unwrap()
    } catch (error) {
      Logger.error('avalanche_addAccount: failed to add account', error)
      return {
        success: false,
        error: rpcErrors.internal(extractAddAccountErrorMessage(error))
      }
    }

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
