import { AppListenerEffectAPI } from 'store'
import { rpcErrors } from '@metamask/rpc-errors'
import { removeContact, selectContacts } from 'store/addressBook'
import Logger from 'utils/Logger'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type AvalancheRemoveContactRequest =
  RpcRequest<RpcMethod.AVALANCHE_REMOVE_CONTACT>

class AvalancheRemoveContactHandler
  implements RpcRequestHandler<AvalancheRemoveContactRequest>
{
  methods = [RpcMethod.AVALANCHE_REMOVE_CONTACT]

  handle = async (
    request: AvalancheRemoveContactRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const { params } = request.data.params.request

    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams('Contact ID is invalid')
      }
    }
    const contactId = result.data[0].id

    const existingContacts = selectContacts(getState())
    const existingContact = existingContacts[contactId]

    if (!existingContact) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Contact does not exist')
      }
    }

    // Navigation.navigate({
    //   name: AppNavigation.Root.Wallet,
    //   params: {
    //     screen: AppNavigation.Modal.CreateRemoveContactV2,
    //     params: {
    //       request,
    //       contact: existingContact,
    //       action: 'remove'
    //     }
    //   }
    // })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: AvalancheRemoveContactRequest; data?: unknown },
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

    const contact = result.data.contact

    dispatch(removeContact(contact.id))

    return { success: true, value: [] }
  }
}

export const avalancheRemoveContactHandler = new AvalancheRemoveContactHandler()
