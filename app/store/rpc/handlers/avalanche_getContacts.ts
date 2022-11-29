import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { selectContacts } from 'store/addressBook'
import { Contact as SharedContact } from '@avalabs/types'
import { sendRpcResult } from '../slice'
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
      sendRpcResult({
        request: { payload: action.payload },
        result: sharedContacts
      })
    )
  }
}
export const avalancheGetContactsHandler = new AvalancheGetContactsHandler()
