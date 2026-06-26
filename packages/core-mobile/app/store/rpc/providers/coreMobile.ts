import { selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getAddressForChainId } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { onInAppRequestFailed, onInAppRequestSucceeded } from '../slice'
import { AgnosticRpcProvider, RpcMethod, RpcProvider } from '../types'
import { isTxSendMethod } from '../utils/txSendMethods'
import { isDappOriginatedUrl } from '../utils/isDappOriginatedRequest'
import { normalizeAnalyticsAddress } from '../utils/normalizeAnalyticsAddress'
import { isSessionProposal } from './walletConnect/utils'

// For eth_sendTransaction the dApp names the signer via the tx `from`, which the
// injected router validates and which may be a granted, NON-active account.
// Prefer it so _success reports the actual signer (matching _confirmed/_failed,
// which read the cached signer) rather than the active account. CP-13825.
const getTxFromAddress = (
  method: RpcMethod,
  params: unknown
): string | undefined => {
  if (method !== RpcMethod.ETH_SEND_TRANSACTION) return undefined
  const tx = Array.isArray(params) ? params[0] : undefined
  const from =
    tx && typeof tx === 'object' && 'from' in tx
      ? (tx as { from?: unknown }).from
      : undefined
  return typeof from === 'string' && from ? from : undefined
}

class CoreMobileProvider implements AgnosticRpcProvider {
  provider = RpcProvider.CORE_MOBILE

  onError: AgnosticRpcProvider['onError'] = async ({
    request,
    error,
    listenerApi
  }) => {
    const requestId = request.data.id
    listenerApi.dispatch(onInAppRequestFailed({ requestId, error }))
  }

  onSuccess: AgnosticRpcProvider['onSuccess'] = async ({
    request,
    result,
    listenerApi
  }) => {
    const requestId = request.data.id
    listenerApi.dispatch(
      onInAppRequestSucceeded({ requestId, txHash: result as string })
    )

    // Mirror the WalletConnect provider's _success capture so dApp transactions
    // made through the injected browser are not dropped from per-network (MTU)
    // analytics. Gated to dApp-originated requests so wallet-internal flows
    // (Send / Swap / Stake) — which carry CORE_MOBILE_META — are excluded.
    // CP-13825.
    if (isSessionProposal(request)) return

    if (
      isTxSendMethod(request.method) &&
      typeof result === 'string' &&
      result &&
      isDappOriginatedUrl(request.peerMeta?.url)
    ) {
      const chainId = request.data.params.chainId
      const fromAddress = getTxFromAddress(
        request.method,
        request.data.params.request.params
      )
      const account = selectActiveAccount(listenerApi.getState())
      const address = normalizeAnalyticsAddress(
        fromAddress ??
          (account ? getAddressForChainId(chainId, account) ?? '' : '')
      )
      AnalyticsService.capture(`${request.method}_success`, {
        encrypted: {
          dAppUrl: request.peerMeta.url,
          address,
          chainId,
          txHash: result
        }
      })
    }
  }
  validateRequest: AgnosticRpcProvider['validateRequest'] = (): void => {
    // do nothing
  }
}

export const coreMobileProvider = new CoreMobileProvider()
