import { AppListenerEffectAPI } from 'store'
import { SessionTypes } from '@walletconnect/types'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { ethErrors } from 'eth-rpc-errors'
import { showSimpleToast, showDappToastError } from 'components/Snackbar'
import Logger from 'utils/Logger'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import { UPDATE_SESSION_DELAY } from 'consts/walletConnect'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { onSendRpcError, onSendRpcResult } from '../slice'
import { isSessionProposal } from './utils'

export const sendRpcResult = async (
  action: ReturnType<typeof onSendRpcResult>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { request, result } = action.payload
  const { getState } = listenerApi

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
      const optionalNamespaces = JSON.stringify(session.optionalNamespaces)

      const message = `Connected to ${name}`

      showSimpleToast(message)

      AnalyticsService.capture('WalletConnectSessionApprovedV2', {
        namespaces,
        requiredNamespaces,
        optionalNamespaces,
        dappUrl: url
      })

      /**
       * update session with active chainId and address for 2 reasons
       * 1/ let dapps stay in sync with wallet. this is crucial for dapps that use wagmi.
       * 2/ allow namespaces' methods and events of dapps to be updated to the one we specify above.
       *    wagmi has a bug where it doesn't update the methods and events of dapps on session approval.
       *
       * notes: the delay is to allow dapps to settle down after session approval. wallet connect se sdk also does the same.
       */
      const state = getState()
      const address = selectActiveAccount(state)?.address
      const { chainId } = selectActiveNetwork(state)
      address &&
        setTimeout(() => {
          WalletConnectService.updateSessionWithTimeout({
            session,
            chainId,
            address
          })
        }, UPDATE_SESSION_DELAY)
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
): Promise<void> => {
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
