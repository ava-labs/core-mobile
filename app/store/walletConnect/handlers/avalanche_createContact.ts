import { PayloadAction } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { Contact as SharedContact } from '@avalabs/types'
import { ethErrors } from 'eth-rpc-errors'
import { addContact } from 'store/addressBook'
import {
  addRequest,
  sendRpcResult,
  sendRpcError,
  removeRequest
} from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'
import { parseContact } from './utils/contact'

export interface AvalancheCreateContactRequest
  extends DappRpcRequest<
    RpcMethod.AVALANCHE_CREATE_CONTACT,
    SharedContact[] | undefined
  > {
  contact: SharedContact
}

class AvalancheCreateContactHandler
  implements RpcRequestHandler<AvalancheCreateContactRequest>
{
  methods = [RpcMethod.AVALANCHE_CREATE_CONTACT]

  handle = async (
    action: PayloadAction<AvalancheCreateContactRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { dispatch } = listenerApi
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

    contact.id = uuidv4()

    const dAppRequest: AvalancheCreateContactRequest = {
      payload: action.payload,
      contact
    }

    dispatch(addRequest(dAppRequest))
  }

  onApprove = async (
    action: PayloadAction<{ request: AvalancheCreateContactRequest }, string>,
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
export const avalancheCreateContactHandler = new AvalancheCreateContactHandler()
