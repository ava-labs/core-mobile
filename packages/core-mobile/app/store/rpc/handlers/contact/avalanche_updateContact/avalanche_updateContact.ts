import { AppListenerEffectAPI } from 'store'
import { rpcErrors } from '@metamask/rpc-errors'
import { selectContacts } from 'store/addressBook'
import Logger from 'utils/Logger'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseApproveData, parseRequestParams } from './utils'

export type AvalancheUpdateContactRequest =
  RpcRequest<RpcMethod.AVALANCHE_UPDATE_CONTACT>

class AvalancheUpdateContactHandler
  implements RpcRequestHandler<AvalancheUpdateContactRequest>
{
  methods = [RpcMethod.AVALANCHE_UPDATE_CONTACT]

  handle = async (
    request: AvalancheUpdateContactRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const { params } = request.data.params.request

    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: rpcErrors.invalidParams('Contact is invalid')
      }
    }

    const contact = result.data[0]

    const existingContacts = selectContacts(getState())
    const existingContact = existingContacts[contact.id]

    if (!existingContact) {
      return {
        success: false,
        error: rpcErrors.resourceNotFound('Contact does not exist')
      }
    }

    // TODO use updated navigate
    // Navigation.navigate({
    //   name: AppNavigation.Root.Wallet,
    //   params: {
    //     screen: AppNavigation.Modal.UpdateContactV2,
    //     params: {
    //       request,
    //       contact
    //     }
    //   }
    // })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: AvalancheUpdateContactRequest; data?: unknown },
    _listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    //const { dispatch } = listenerApi

    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: rpcErrors.internal('Invalid approve data')
      }
    }

    // const contact = result.data.contact

    // TODO use updated addContact
    // addContact({
    //   address: contact.address,
    //   addressBTC: contact.addressBTC || '',
    //   addressXP: contact.addressXP || '',
    //   name: contact.name,
    //   id: contact.id
    // })

    return { success: true, value: [] }
  }
}

export const avalancheUpdateContactHandler = new AvalancheUpdateContactHandler()
