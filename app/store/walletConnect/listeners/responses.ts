import { AppListenerEffectAPI } from 'store'
import WalletConnectServiceV11 from 'services/walletconnect/WalletConnectService'
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

    const session = WalletConnectServiceV11.approveSession(peerId, approveData)
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
    WalletConnectServiceV11.approveCall(peerId, id, result)
  }
}

export const sendRpcError = async (
  action: ReturnType<typeof onSendRpcError>
) => {
  const { request, error } = action.payload
  const peerId = request.payload.peerId
  if (isSessionRequestRpcRequest(request)) {
    WalletConnectServiceV11.rejectSession(peerId)
  } else {
    WalletConnectServiceV11.rejectCall(
      peerId,
      request.payload.id,
      error ?? ethErrors.rpc.internal()
    )
  }
}
