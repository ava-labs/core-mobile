import { AppListenerEffectAPI } from 'store/index'
import { PayloadAction } from '@reduxjs/toolkit'
import { approveCall } from 'contexts/DappConnectionContext/useWalletConnect'
import { removeRequest } from '../slice'

export const onSendRpcResult = async (
  action: PayloadAction<{ id: number; result: unknown }, string>,
  listenerApi: AppListenerEffectAPI
) => {
  const { dispatch } = listenerApi
  const { id, result } = action.payload
  dispatch(removeRequest(id))

  approveCall(id, result)
}
