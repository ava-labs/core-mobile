import { v4 as uuidv4 } from 'uuid'
import { AppListenerEffectAPI } from 'store'
import { ethErrors } from 'eth-rpc-errors'
import { addContact } from 'store/addressBook'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { RpcMethod, RpcRequest } from '../../../types'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../../types'
import { parseRequestParams, parseApproveData } from './utils'

export type AvalancheCreateContactRequest =
  RpcRequest<RpcMethod.AVALANCHE_CREATE_CONTACT>

class AvalancheCreateContactHandler
  implements RpcRequestHandler<AvalancheCreateContactRequest>
{
  methods = [RpcMethod.AVALANCHE_CREATE_CONTACT]

  handle = async (request: AvalancheCreateContactRequest): HandleResponse => {
    const { params } = request.data.params.request

    const result = parseRequestParams(params)

    if (!result.success) {
      Logger.error('invalid params', result.error)
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Contact is invalid'
        })
      }
    }

    const contact = {
      ...result.data[0],
      id: uuidv4()
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.CreateRemoveContactV2,
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
      data?: unknown
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    const { dispatch } = listenerApi
    const result = parseApproveData(payload.data)

    if (!result.success) {
      return {
        success: false,
        error: ethErrors.rpc.internal('Invalid approve data')
      }
    }

    const contact = result.data.contact

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

export const avalancheCreateContactHandler = new AvalancheCreateContactHandler()
