import { AppListenerEffectAPI } from 'store'
import { selectContacts } from 'store/addressBook'
import { Contact as SharedContact } from '@avalabs/types'
import { RpcMethod, RpcRequest } from '../../types'
import { HandleResponse, RpcRequestHandler } from '../types'
import { mapContactToSharedContact } from './utils'

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

    const sharedContacts: SharedContact[] = Object.values(contacts).map(
      mapContactToSharedContact
    )

    return { success: true, value: sharedContacts }
  }
}
export const avalancheGetContactsHandler = new AvalancheGetContactsHandler()
