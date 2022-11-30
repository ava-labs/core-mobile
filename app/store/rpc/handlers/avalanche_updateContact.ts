import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { Contact as SharedContact } from '@avalabs/types'
import { ethErrors } from 'eth-rpc-errors'
import { addContact, selectContacts } from 'store/addressBook'
import {
  addRequest,
  sendRpcResult,
  sendRpcError,
  removeRequest
} from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'
import { parseContact } from './utils/contact'

export interface AvalancheUpdateContactRequest
  extends DappRpcRequest<
    RpcMethod.AVALANCHE_UPDATE_CONTACT,
    SharedContact[] | undefined
  > {
  contact: SharedContact
}

class AvalancheUpdateContactHandler
  implements RpcRequestHandler<AvalancheUpdateContactRequest>
{
  methods = [RpcMethod.AVALANCHE_UPDATE_CONTACT]

  handle = async (
    action: PayloadAction<AvalancheUpdateContactRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch, getState } = listenerApi
    const { params } = action.payload
    const contact = parseContact(params)

    if (!contact) {
      dispatch(
        sendRpcError({
          request: action,
          error: ethErrors.rpc.invalidParams({
            message: 'Contact is invalid'
          })
        })
      )
      return
    }

    const existingContacts = selectContacts(getState())
    const existingContact = existingContacts[contact.id]

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

    const dAppRequest: AvalancheUpdateContactRequest = {
      payload: action.payload,
      contact
    }

    dispatch(addRequest(dAppRequest))
  }

  onApprove = async (
    action: PayloadAction<
      { request: AvalancheUpdateContactRequest; result?: unknown },
      string
    >,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
    const contact = action.payload.request.contact

    dispatch(
      addContact({
        address: contact.address,
        addressBtc: contact.addressBTC || '',
        title: contact.name,
        id: contact.id
      })
    )

    dispatch(
      sendRpcResult({
        request: action.payload.request,
        result: []
      })
    )

    dispatch(removeRequest(action.payload.request.payload.id))
  }
}
export const avalancheUpdateContactHandler = new AvalancheUpdateContactHandler()
