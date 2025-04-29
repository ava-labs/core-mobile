import { AppListenerEffectAPI } from 'store/types'
import { selectContacts } from 'store/addressBook'
import { RpcMethod, RpcRequest } from '../../types'
import { HandleResponse, RpcRequestHandler } from '../types'

export type AvalancheGetContactsRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_GET_CONTACTS>

class AvalancheGetContactsHandler
  implements RpcRequestHandler<AvalancheGetContactsRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_GET_CONTACTS]

  handle = async (
    _request: AvalancheGetContactsRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const contacts = selectContacts(listenerApi.getState())
    const contactsArray = Object.values(contacts).map(value => value)
    return { success: true, value: contactsArray }
  }
}

export const avalancheGetContactsHandler = new AvalancheGetContactsHandler()
