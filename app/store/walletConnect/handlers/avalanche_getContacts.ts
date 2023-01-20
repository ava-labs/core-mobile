import { PayloadAction } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import { selectContacts } from 'store/addressBook'
import { Contact as SharedContact } from '@avalabs/types'
import { onSendRpcResult } from '../slice'
import { RpcMethod } from '../types'
import { DappRpcRequest, RpcRequestHandler } from './types'
import { mapContactToSharedContact } from './utils/contact'

export type AvalancheGetContactsRpcRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_GET_CONTACTS,
  []
>

class AvalancheGetContactsHandler
  implements RpcRequestHandler<AvalancheGetContactsRpcRequest>
{
  methods = [RpcMethod.AVALANCHE_GET_CONTACTS]

  handle = async (
    action: PayloadAction<AvalancheGetContactsRpcRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const contacts = selectContacts(listenerApi.getState())

    const sharedContacts: SharedContact[] = Object.values(contacts).map(
      mapContactToSharedContact
    )

    listenerApi.dispatch(
      onSendRpcResult({
        request: { payload: action.payload },
        result: sharedContacts
      })
    )
  }
}
export const avalancheGetContactsHandler = new AvalancheGetContactsHandler()
