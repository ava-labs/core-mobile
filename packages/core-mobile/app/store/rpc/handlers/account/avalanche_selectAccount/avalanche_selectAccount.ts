import { AppListenerEffectAPI } from 'store/types'
import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import { selectAccountById, selectActiveAccount } from 'store/account/slice'
import { setActiveAccount } from 'store/account/thunks'
import Logger from 'utils/Logger'
import { RpcMethod, RpcProvider, RpcRequest } from '../../../types'
import { HandleResponse, RpcRequestHandler } from '../../types'
import { isVerifiedCoreDomain } from '../../wc_sessionRequest/utils'
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

    // pre-#4076 sessions may still hold Core methods for a spoofed extension identity
    if (
      request.provider === RpcProvider.WALLET_CONNECT &&
      !isVerifiedCoreDomain(request.data.verifyContext)
    ) {
      Logger.warn('avalanche_selectAccount: rejected unverified WC request', {
        origin: request.data.verifyContext?.verified.origin,
        validation: request.data.verifyContext?.verified.validation
      })
      return {
        success: false,
        error: providerErrors.unauthorized(
          'Request is not from a verified Core domain'
        )
      }
    }

    const accountId = result.data[0]

    const activeAccount = selectActiveAccount(getState())

    const accountAlreadyActive = activeAccount && activeAccount.id === accountId

    if (accountAlreadyActive) {
      return { success: true, value: null }
    }

    const requestedAccount = selectAccountById(accountId)(getState())

    if (requestedAccount === undefined) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Requested account does not exist')
      }
    }

    dispatch(setActiveAccount(requestedAccount.id))

    return { success: true, value: [] }
  }
}

export const avalancheSelectAccountHandler = new AvalancheSelectAccountHandler()
