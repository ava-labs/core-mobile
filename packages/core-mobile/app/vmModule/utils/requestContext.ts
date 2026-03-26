import { RpcRequest } from '@avalabs/vm-module-types'
import { RequestContext } from 'store/rpc/types'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'

export function isInAppAvalancheRequest(request: RpcRequest): boolean {
  const numericChainId = getChainIdFromCaip2(request.chainId)
  return (
    numericChainId !== undefined &&
    isAvalancheChainId(numericChainId) &&
    isInAppRequest(request)
  )
}

export function isTxFeedbackEnabled(request: RpcRequest): boolean {
  return !request.context?.[RequestContext.SUPPRESS_TX_FEEDBACK]
}

export function isSuccessToastEnabled(request: RpcRequest): boolean {
  return !request.context?.[RequestContext.SUCCESS_TOAST_DISABLED]
}

export function isImmediateSentToast(request: RpcRequest): boolean {
  return Boolean(request.context?.[RequestContext.IMMEDIATE_SENT_TOAST])
}

export function isConfettiEnabled(request: RpcRequest): boolean {
  return !request.context?.[RequestContext.CONFETTI_DISABLED]
}

export function isInAppReview(request: RpcRequest): boolean {
  return Boolean(request.context?.[RequestContext.IN_APP_REVIEW])
}

export function showConfetti(): void {
  setTimeout(() => {
    confetti.restart()
  }, 100)
}
