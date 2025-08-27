import { AppListenerEffectAPI } from 'store/types'
import { rpcErrors } from '@metamask/rpc-errors'
import { addContact, AddrBookItemType } from 'store/addressBook'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'
import { router } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
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
        error: rpcErrors.invalidParams('Contact is invalid')
      }
    }

    const contact = {
      ...result.data[0],
      type: 'contact' as AddrBookItemType,
      id: uuid()
    }

    walletConnectCache.editContactParams.set({
      request,
      contact,
      action: 'create'
    })

    // @ts-ignore TODO: make routes typesafe
    router.navigate('/editContact')
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
        error: rpcErrors.internal('Invalid approve data')
      }
    }

    const contact = result.data.contact

    dispatch(
      addContact({
        type: 'contact',
        address: contact.address ? contact.address : undefined,
        addressBTC: contact.addressBTC ? contact.addressBTC : undefined,
        addressXP: contact.addressXP ? contact.addressXP : undefined,
        addressSVM: contact.addressSVM ? contact.addressSVM : undefined,
        name: contact.name,
        id: contact.id
      })
    )

    return { success: true, value: [] }
  }
}

export const avalancheCreateContactHandler = new AvalancheCreateContactHandler()
