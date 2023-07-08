import { AppListenerEffectAPI } from 'store'
import { SessionTypes } from '@walletconnect/types'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { ethErrors } from 'eth-rpc-errors'
import { capture } from 'store/posthog'
import { showSimpleToast, showDappToastError } from 'components/Snackbar'
import Logger from 'utils/Logger'
import { onSendRpcError, onSendRpcResult } from '../slice'
import { isSessionProposal } from './utils'

export const sendRpcResult = async (
  action: ReturnType<typeof onSendRpcResult>,
  listenerApi: AppListenerEffectAPI
) => {
  const { request, result } = action.payload
  const { dispatch } = listenerApi

  if (isSessionProposal(request)) {
    const relayProtocol = request.data.params.relays[0]?.protocol

    const approveData = {
      id: request.data.id,
      relayProtocol,
      namespaces: result as SessionTypes.Namespaces
    }

    try {
      const session = await WalletConnectService.approveSession(approveData)

      const { name, url } = session.peer.metadata

      const namespaces = JSON.stringify(session.namespaces)
      const requiredNamespaces = JSON.stringify(session.requiredNamespaces)

      const message = `Connected to ${name}`

      showSimpleToast(message)

      dispatch(
        capture({
          event: 'WalletConnectSessionApprovedV2',
          properties: {
            namespaces,
            requiredNamespaces,
            dappUrl: url
          }
        })
      )
    } catch (e) {
      Logger.error('Unable to approve session proposal', e)
      showDappToastError(
        'Unable to approve session proposal',
        request.data.params.proposer.metadata.name
      )
    }
  } else {
    const topic = request.data.topic
    const requestId = request.data.id

    try {
      await WalletConnectService.approveRequest(topic, requestId, result)
    } catch (e) {
      Logger.error('Unable to approve request', e)
      showDappToastError(
        'Unable to approve request',
        request.session.peer.metadata.name
      )
    }
  }
}

export const sendRpcError = async (
  action: ReturnType<typeof onSendRpcError>
) => {
  const { request, error } = action.payload

  // only show error toast if it is not a user rejected error
  const shouldShowErrorToast =
    error.code !== ethErrors.provider.userRejectedRequest().code

  if (isSessionProposal(request)) {
    const dappName = request.data.params.proposer.metadata.name

    shouldShowErrorToast && showDappToastError(error.message, dappName)

    try {
      await WalletConnectService.rejectSession(request.data.id)
    } catch (e) {
      Logger.error('Unable to reject session proposal', e)
      showDappToastError('Unable to reject session proposal', dappName)
    }
  } else {
    const topic = request.data.topic
    const requestId = request.data.id
    const dappName = request.session.peer.metadata.name

    shouldShowErrorToast && showDappToastError(error.message, dappName)

    try {
      await WalletConnectService.rejectRequest(
        topic,
        requestId,
        error ?? ethErrors.rpc.internal()
      )
    } catch (e) {
      Logger.error('Unable to reject request', e)
      showDappToastError('Unable to reject request', dappName)
    }
  }
}
