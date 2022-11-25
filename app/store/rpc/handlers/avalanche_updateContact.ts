import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { Contact as SharedContact } from '@avalabs/types'
import { getContactValidationError } from 'screens/drawer/addressBook/utils'
import { ethErrors } from 'eth-rpc-errors'
import { addContact } from 'store/addressBook'
import {
  addRequest,
  sendRpcResult,
  sendRpcError,
  removeRequest
} from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'

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

  private parseContact = (params: SharedContact[] | undefined) => {
    const contact = params?.[0]

    if (
      getContactValidationError(
        contact?.name,
        contact?.address,
        contact?.addressBTC
      ) === undefined
    ) {
      return contact
    }

    return undefined
  }

  handle = async (
    action: PayloadAction<AvalancheUpdateContactRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const { params } = action.payload
    const contact = this.parseContact(params)

    if (!contact) {
      sendRpcError({
        request: action,
        error: ethErrors.rpc.invalidParams()
      })
      return
    }

    const dAppRequest: AvalancheUpdateContactRequest = {
      payload: action.payload,
      contact
    }

    listenerApi.dispatch(addRequest(dAppRequest))
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
