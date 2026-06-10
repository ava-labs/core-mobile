import { selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getAddressForChainId } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { onInAppRequestFailed, onInAppRequestSucceeded } from '../slice'
import { AgnosticRpcProvider, RpcProvider } from '../types'
import { isTxSendMethod } from '../utils/txSendMethods'
import { isDappOriginatedUrl } from '../utils/isDappOriginatedRequest'
import { isSessionProposal } from './walletConnect/utils'

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
      const account = selectActiveAccount(listenerApi.getState())
      const address = account
        ? getAddressForChainId(chainId, account) ?? ''
        : ''
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
