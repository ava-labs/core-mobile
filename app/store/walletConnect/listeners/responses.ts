import { AppListenerEffectAPI } from 'store'
import WalletConnectService from 'services/walletconnect/WalletConnectService'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { ethErrors } from 'eth-rpc-errors'
import { capture } from 'store/posthog'
import { addDapp, onSendRpcError, onSendRpcResult } from '../slice'
import { isSessionRequestRpcRequest } from '../utils'

export const sendRpcResult = async (
  action: ReturnType<typeof onSendRpcResult>,
  listenerApi: AppListenerEffectAPI
) => {
  const { request, result } = action.payload
  const { dispatch, getState } = listenerApi
  const peerId = request.payload.peerId
  const id = request.payload.id

  if (isSessionRequestRpcRequest(request)) {
    const { chainId } = selectActiveNetwork(getState())
    const address = selectActiveAccount(getState())?.address || ''

    const approveData = {
      chainId: chainId,
      accounts: [address]
    }

    const session = WalletConnectService.approveSession(peerId, approveData)
    session && dispatch(addDapp(session))

    dispatch(
      capture({
        event: 'WalletConnectSessionApproved',
        properties: {
          dappId: peerId,
          dappUrl: request.payload.peerMeta?.url ?? null
        }
      })
    )
  } else {
    WalletConnectService.approveCall(peerId, id, result)
  }
}

export const sendRpcError = async (
  action: ReturnType<typeof onSendRpcError>
) => {
  const { request, error } = action.payload
  const peerId = request.payload.peerId
  if (isSessionRequestRpcRequest(request)) {
    WalletConnectService.rejectSession(peerId)
  } else {
    WalletConnectService.rejectCall(
      peerId,
      request.payload.id,
      error ?? ethErrors.rpc.internal()
    )
  }
}
