import { AppListenerEffectAPI } from 'store'
import { Contact as SharedContact } from '@avalabs/types'
import { ethErrors } from 'eth-rpc-errors'
import { removeContact, selectContacts } from 'store/addressBook'
import { isString } from 'utils/string/isString'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { RpcMethod } from 'store/walletConnectV2'
import {
  ApproveResponse,
  DappRpcRequest,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from './types'
import { mapContactToSharedContact } from './utils/contact'

export type AvalancheRemoveContactRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_REMOVE_CONTACT,
  { id: string }[] | undefined
>

type ApproveData = {
  contact: SharedContact
}

class AvalancheRemoveContactHandler
  implements RpcRequestHandler<AvalancheRemoveContactRequest, ApproveData>
{
  methods = [RpcMethod.AVALANCHE_REMOVE_CONTACT]

  handle = async (
    request: AvalancheRemoveContactRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const { params } = request.payload
    const contactId = params?.[0]?.id

    if (!isString(contactId)) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Contact ID is invalid'
        })
      }
    }

    const existingContacts = selectContacts(getState())
    const existingContact = existingContacts[contactId]

    if (!existingContact) {
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound({
          message: 'Contact does not exist'
        })
      }
    }

    const contact = mapContactToSharedContact(existingContact)

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.CreateRemoveContact,
        params: {
          request,
          contact,
          action: 'remove'
        }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: AvalancheRemoveContactRequest; data: ApproveData },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const contact = payload.data.contact

    dispatch(removeContact(contact.id))

    return { success: true, value: [] }
  }
}

export const avalancheRemoveContactHandler = new AvalancheRemoveContactHandler()
