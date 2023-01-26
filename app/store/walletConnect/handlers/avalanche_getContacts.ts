import { AppListenerEffectAPI } from 'store'
import { selectContacts } from 'store/addressBook'
import { Contact as SharedContact } from '@avalabs/types'
import { RpcMethod } from '../types'
import { DappRpcRequest, HandleResponse, RpcRequestHandler } from './types'
import { mapContactToSharedContact } from './utils/contact'

export type AvalancheGetContactsRpcRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_GET_CONTACTS,
  []
>

class AvalancheGetContactsHandler
  implements RpcRequestHandler<AvalancheGetContactsRpcRequest, never>
{
  methods = [RpcMethod.AVALANCHE_GET_CONTACTS]

  handle = async (
    request: AvalancheGetContactsRpcRequest,
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
