import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { selectContacts } from 'store/addressBook'
import { Contact as SharedContact } from '@avalabs/types'
import { sendRpcResult } from '../slice'
import { DappRpcRequest, RpcRequestHandler } from './types'

export type AvalancheGetContactsRpcRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
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
      contact => ({
        id: contact.id,
        name: contact.title,
        address: contact.address,
        addressBTC: contact.addressBtc
      })
    )

    listenerApi.dispatch(
      sendRpcResult({
        id: action.payload.id,
        result: sharedContacts
      })
    )
  }
}
export const avalancheGetContactsHandler = new AvalancheGetContactsHandler()
