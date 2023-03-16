import { v4 as uuidv4 } from 'uuid'
import { AppListenerEffectAPI } from 'store'
import { Contact as SharedContact } from '@avalabs/types'
import { ethErrors } from 'eth-rpc-errors'
import { addContact } from 'store/addressBook'
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

export type AvalancheCreateContactRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_CREATE_CONTACT,
  SharedContact[] | undefined
>

type ApproveData = {
  contact: SharedContact
}

class AvalancheCreateContactHandler
  implements RpcRequestHandler<AvalancheCreateContactRequest, ApproveData>
{
  methods = [RpcMethod.AVALANCHE_CREATE_CONTACT]

  handle = async (request: AvalancheCreateContactRequest): HandleResponse => {
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

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.CreateRemoveContact,
        params: {
          request,
          contact,
          action: 'create'
        }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: {
      request: AvalancheCreateContactRequest
      data: ApproveData
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const contact = payload.data.contact

    dispatch(
      addContact({
        address: contact.address,
        addressBtc: contact.addressBTC || '',
        title: contact.name,
        id: uuidv4()
      })
    )

    return { success: true, value: [] }
  }
}

export const avalancheCreateContactHandler = new AvalancheCreateContactHandler()
