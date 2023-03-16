import { AppListenerEffectAPI } from 'store'
import { Contact as SharedContact } from '@avalabs/types'
import { ethErrors } from 'eth-rpc-errors'
import { addContact, selectContacts } from 'store/addressBook'
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
import { parseContact } from './utils/contact'

export interface AvalancheUpdateContactRequest
  extends DappRpcRequest<
    RpcMethod.AVALANCHE_UPDATE_CONTACT,
    SharedContact[] | undefined
  > {
  contact: SharedContact
}

type ApproveData = {
  contact: SharedContact
}

class AvalancheUpdateContactHandler
  implements RpcRequestHandler<AvalancheUpdateContactRequest, ApproveData>
{
  methods = [RpcMethod.AVALANCHE_UPDATE_CONTACT]

  handle = async (
    request: AvalancheUpdateContactRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const { params } = request.payload
    const contact = parseContact(params)

    if (!contact) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Contact is invalid'
        })
      }
    }

    const existingContacts = selectContacts(getState())
    const existingContact = existingContacts[contact.id]

    if (!existingContact) {
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound({
          message: 'Contact does not exist'
        })
      }
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.UpdateContact,
        params: {
          request,
          contact
        }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: { request: AvalancheUpdateContactRequest; data: ApproveData },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const contact = payload.data.contact

    dispatch(
      addContact({
        address: contact.address,
        addressBtc: contact.addressBTC || '',
        title: contact.name,
        id: contact.id
      })
    )

    return { success: true, value: [] }
  }
}

export const avalancheUpdateContactHandler = new AvalancheUpdateContactHandler()
