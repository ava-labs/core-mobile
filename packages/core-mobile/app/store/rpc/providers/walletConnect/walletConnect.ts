import { rpcErrors } from '@metamask/rpc-errors'
import Logger from 'utils/Logger'
import { selectNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { SessionTypes } from '@walletconnect/types'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import { UPDATE_SESSION_DELAY } from 'consts/walletConnect'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { transactionSnackbar } from 'new/common/utils/toast'
import { Account } from 'store/account/types'
import { getAddressForChainId } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { AgnosticRpcProvider, RpcMethod, RpcProvider } from '../../types'
import { isTxSendMethod } from '../../utils/txSendMethods'
import { normalizeAnalyticsAddress } from '../../utils/normalizeAnalyticsAddress'
import { isSessionProposal, isUserRejectedError } from './utils'
import { transformSolanaParams } from './solanaRequestUtils'

// Solana signing methods require the result to be wrapped in a specific shape
// before being returned to the dapp via WalletConnect
const transformResult = (method: RpcMethod, result: unknown): unknown => {
  if (method === RpcMethod.SOLANA_SIGN_MESSAGE) return { signature: result }
  if (method === RpcMethod.SOLANA_SIGN_TRANSACTION) {
    return { transaction: result }
  }
  return result
}

const getAddressForChain = (
  account: Account | null | undefined,
  caip2ChainId: string
): string => {
  if (!account) return ''
  return getAddressForChainId(caip2ChainId, account) ?? ''
}

const chainAgnosticMethods = [
  RpcMethod.AVALANCHE_CREATE_CONTACT,
  RpcMethod.AVALANCHE_GET_CONTACTS,
  RpcMethod.AVALANCHE_REMOVE_CONTACT,
  RpcMethod.AVALANCHE_UPDATE_CONTACT,
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  RpcMethod.AVALANCHE_SELECT_ACCOUNT,
  RpcMethod.WALLET_ADD_ETHEREUM_CHAIN,
  RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY,
  RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
  RpcMethod.AVALANCHE_RENAME_ACCOUNT
]

// Read-only methods that dApps fire automatically, not from a user action —
// e.g. core.app polls wallet_getNetworkState every ~3s while connected. Their
// failures must still be returned to the dApp (it recovers on its own), but
// never surfaced as an error toast: after a testnet/mainnet switch there is an
// inherent propagation window (session update + chainChanged over the relay)
// during which these background requests keep arriving scoped to the previous
// environment, and validateRequest rejects each one — toasting every rejection
// showed the user 1-2 "Invalid environment" snackbars per toggle. User-initiated
// methods (signing etc.) keep the toast so the user learns why their action
// failed. CP-14617.
const dappAutomatedReadMethods: RpcMethod[] = [
  RpcMethod.WALLET_GET_NETWORK_STATE,
  RpcMethod.WALLET_GET_ETHEREUM_CHAIN,
  RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE,
  RpcMethod.AVALANCHE_GET_BRIDGE_STATE
]

class WalletConnectProvider implements AgnosticRpcProvider {
  provider = RpcProvider.WALLET_CONNECT

  onError: AgnosticRpcProvider['onError'] = async ({ request, error }) => {
    // only show error toast if it is not a user rejected error and the request
    // was user-initiated (background dApp polls must not toast — CP-14617)
    const shouldShowErrorToast =
      !isUserRejectedError(error) &&
      !dappAutomatedReadMethods.includes(request.method)

    if (isSessionProposal(request)) {
      shouldShowErrorToast &&
        transactionSnackbar.error({
          message: 'Connection failed',
          error: error.message
        })

      try {
        await WalletConnectService.rejectSession(request.data.id)
      } catch (e) {
        Logger.error('Unable to reject session proposal', e)
      }
    } else {
      const topic = request.data.topic
      const requestId = request.data.id

      shouldShowErrorToast &&
        transactionSnackbar.error({ error: getJsonRpcErrorMessage(error) })

      try {
        await WalletConnectService.rejectRequest(
          topic,
          requestId,
          error ?? rpcErrors.internal()
        )
      } catch (e) {
        Logger.error('Unable to reject request', e)
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

        transactionSnackbar.success({ message: `Connected to ${name}` })

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

        transactionSnackbar.error({
          message: 'Approval failed',
          error: (e as Error).message
        })
      }
    } else {
      const topic = request.data.topic
      const requestId = request.data.id

      const transformedResult = transformResult(request.method, result)

      // fire _success when the txHash is returned (transaction submitted to mempool)
      // _confirmed fires later via ApprovalController.onTransactionConfirmed once the VM module
      // polls getTransactionReceipt and the chain finalizes the transaction
      // skip capture if result is not a non-empty string — a missing txHash would produce
      // misleading "success" events and skew MTU / lifecycle metrics
      if (
        isTxSendMethod(request.method) &&
        typeof result === 'string' &&
        result
      ) {
        const chainId = request.data.params.chainId
        const address = normalizeAnalyticsAddress(
          getAddressForChain(
            selectActiveAccount(listenerApi.getState()),
            chainId
          )
        )
        AnalyticsService.capture(`${request.method}_success`, {
          provider: 'walletConnect',
          encrypted: {
            dAppUrl: request.peerMeta.url,
            address,
            chainId,
            txHash: result
          }
        })
      }

      // For solana_signTransaction the dApp handles broadcast, so we never receive a txHash.
      // Fire _approved on successful signing to enable usage measurement.
      else if (
        request.method === RpcMethod.SOLANA_SIGN_TRANSACTION &&
        typeof result === 'string' &&
        result
      ) {
        const chainId = request.data.params.chainId
        const address = getAddressForChain(
          selectActiveAccount(listenerApi.getState()),
          chainId
        )
        AnalyticsService.capture('solana_signTransaction_approved', {
          encrypted: {
            dAppUrl: request.peerMeta.url,
            address,
            chainId
          }
        })
      }

      try {
        await WalletConnectService.approveRequest(
          topic,
          requestId,
          transformedResult
        )
      } catch (e) {
        Logger.error('Unable to approve request', e)

        transactionSnackbar.error({
          message: 'Approval failed',
          error: (e as Error).message
        })
      }
    }
  }

  validateRequest: AgnosticRpcProvider['validateRequest'] = (
    request,
    listenerApi
  ): void => {
    if (isSessionProposal(request)) return

    if (request.method.includes('solana_')) {
      /**
       * Solana dApps use different parameter formats than our internal VM module:
       * 1. Different dApps (Jupiter, Orca) structure their parameters differently
       * 2. Encoding differences: dApps use base58, our VM uses base64
       * 3. Parameter shape: dApps use {pubkey, message} format, VM expects [{account, serializedMessage}]
       */
      const session = WalletConnectService.getSession(request.data.topic)
      if (session) {
        transformSolanaParams(request.data, session)
      }
    }

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
