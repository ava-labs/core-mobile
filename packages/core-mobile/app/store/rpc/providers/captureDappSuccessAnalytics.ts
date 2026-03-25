import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { Account } from 'store/account/types'
import { getAddressForChainId } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { AppListenerEffectAPI } from 'store/types'
import { isExternalDappUrl } from '../utils/isExternalDappUrl'
import { isTxSendMethod } from '../utils/txSendMethods'
import { RpcMethod, RpcRequest } from '../types'

const getAddressForChain = (
  account: Account | null | undefined,
  caip2ChainId: string
): string => {
  if (!account) return ''
  return getAddressForChainId(caip2ChainId, account) ?? ''
}

export const captureDappSuccessAnalytics = ({
  request,
  result,
  listenerApi
}: {
  request: RpcRequest<RpcMethod>
  result: unknown
  listenerApi: AppListenerEffectAPI
}): void => {
  if (!isExternalDappUrl(request.peerMeta.url)) {
    return
  }

  if (isTxSendMethod(request.method) && typeof result === 'string' && result) {
    const chainId = request.data.params.chainId
    const address = getAddressForChain(
      selectActiveAccount(listenerApi.getState()),
      chainId
    )

    AnalyticsService.captureWithEncryption(`${request.method}_success`, {
      dAppUrl: request.peerMeta.url,
      address,
      chainId,
      txHash: result
    })

    return
  }

  // For solana_signTransaction the dApp handles broadcast, so we never receive a txHash.
  // Fire _approved on successful signing to enable usage measurement.
  if (
    request.method === RpcMethod.SOLANA_SIGN_TRANSACTION &&
    typeof result === 'string' &&
    result
  ) {
    const chainId = request.data.params.chainId
    const address = getAddressForChain(
      selectActiveAccount(listenerApi.getState()),
      chainId
    )

    AnalyticsService.captureWithEncryption('solana_signTransaction_approved', {
      dAppUrl: request.peerMeta.url,
      address,
      chainId
    })
  }
}
