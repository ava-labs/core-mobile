import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { Contact as SharedContact } from '@avalabs/types'
import { ethErrors } from 'eth-rpc-errors'
import { removeContact, selectContacts } from 'store/addressBook'
import { isString } from 'utils/string/isString'
import {
  addRequest,
  sendRpcResult,
  sendRpcError,
  removeRequest
} from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'
import { mapContactToSharedContact } from './utils/contact'

export interface AvalancheRemoveContactRequest
  extends DappRpcRequest<
    RpcMethod.AVALANCHE_REMOVE_CONTACT,
    { id: string }[] | undefined
  > {
  contact: SharedContact
}

class AvalancheRemoveContactHandler
  implements RpcRequestHandler<AvalancheRemoveContactRequest>
{
  methods = [RpcMethod.AVALANCHE_REMOVE_CONTACT]

  handle = async (
    action: PayloadAction<AvalancheRemoveContactRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch, getState } = listenerApi
    const { params } = action.payload

    const contactId = params?.[0]?.id

    if (!isString(contactId)) {
      dispatch(
        sendRpcError({
          request: action,
          error: ethErrors.rpc.invalidParams({
            message: 'Contact ID is invalid'
          })
        })
      )
      return
    }

    const existingContacts = selectContacts(getState())
    const existingContact = existingContacts[contactId]

    if (!existingContact) {
      dispatch(
        sendRpcError({
          request: action,
          error: ethErrors.rpc.resourceNotFound({
            message: 'Contact does not exist'
          })
        })
      )
      return
    }

    const contact = mapContactToSharedContact(existingContact)

    const dAppRequest: AvalancheRemoveContactRequest = {
      payload: action.payload,
      contact
    }

    dispatch(addRequest(dAppRequest))
  }

  onApprove = async (
    action: PayloadAction<{ request: AvalancheRemoveContactRequest }, string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
    const contact = action.payload.request.contact

    dispatch(removeContact(contact.id))

    dispatch(
      sendRpcResult({
        request: action.payload.request,
        result: []
      })
    )

    dispatch(removeRequest(action.payload.request.payload.id))
  }
}
export const avalancheRemoveContactHandler = new AvalancheRemoveContactHandler()
