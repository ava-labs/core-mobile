import { rpcErrors } from '@metamask/rpc-errors'
import Logger from 'utils/Logger'
import { selectNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { SessionTypes } from '@walletconnect/types'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { showDappToastError } from 'components/Snackbar'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import { UPDATE_SESSION_DELAY } from 'consts/walletConnect'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { showDappConnectionSuccessToast } from 'utils/toast'
import { getChainIdFromCaip2 } from 'temp/caip2ChainIds'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage'
import { AgnosticRpcProvider, RpcMethod, RpcProvider } from '../../types'
import { isSessionProposal, isUserRejectedError } from './utils'

const chainAgnosticMethods = [
  RpcMethod.AVALANCHE_CREATE_CONTACT,
  RpcMethod.AVALANCHE_GET_CONTACTS,
  RpcMethod.AVALANCHE_REMOVE_CONTACT,
  RpcMethod.AVALANCHE_UPDATE_CONTACT,
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  RpcMethod.AVALANCHE_SELECT_ACCOUNT,
  RpcMethod.WALLET_ADD_ETHEREUM_CHAIN,
  RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN,
  RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY,
  RpcMethod.AVALANCHE_SET_DEVELOPER_MODE
]

class WalletConnectProvider implements AgnosticRpcProvider {
  provider = RpcProvider.WALLET_CONNECT

  onError: AgnosticRpcProvider['onError'] = async ({ request, error }) => {
    // only show error toast if it is not a user rejected error
    const shouldShowErrorToast = !isUserRejectedError(error)

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
      const dappName = request.peerMeta.name

      shouldShowErrorToast &&
        showDappToastError(getJsonRpcErrorMessage(error), dappName)

      try {
        await WalletConnectService.rejectRequest(
          topic,
          requestId,
          error ?? rpcErrors.internal()
        )
      } catch (e) {
        Logger.error('Unable to reject request', e)
        showDappToastError('Unable to reject request', dappName)
      }
    }
  }

  onSuccess: AgnosticRpcProvider['onSuccess'] = async ({
    request,
    result,
    listenerApi
  }) => {
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

        showDappConnectionSuccessToast({ dappName: name })

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
        const account = selectActiveAccount(state)
        const { chainId } = selectActiveNetwork(state)
        account &&
          setTimeout(() => {
            WalletConnectService.updateSessionWithTimeout({
              session,
              chainId,
              account
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
        const dappName = request.peerMeta.name
        showDappToastError('Unable to approve request', dappName)
      }
    }
  }

  validateRequest: AgnosticRpcProvider['validateRequest'] = (
    request,
    listenerApi
  ): void => {
    if (isSessionProposal(request)) return

    if (chainAgnosticMethods.includes(request.method as RpcMethod)) return

    const { getState } = listenerApi
    const state = getState()
    const isDeveloperMode = selectIsDeveloperMode(state)

    // validate chain against the current developer mode
    const caip2ChainId = request.data.params.chainId
    const chainId = getChainIdFromCaip2(caip2ChainId)

    if (chainId === undefined) {
      throw rpcErrors.internal('Invalid chainId')
    }

    const network = selectNetwork(chainId)(state)

    if (network === undefined) {
      throw rpcErrors.internal('Invalid chainId')
    }

    const isTestnet = Boolean(network.isTestnet)

    if (isTestnet !== isDeveloperMode) {
      const message = isDeveloperMode
        ? 'Invalid environment. Please turn off developer mode and try again'
        : 'Invalid environment. Please turn on developer mode and try again'

      throw rpcErrors.internal(message)
    }
  }
}

export const walletConnectProvider = new WalletConnectProvider()
