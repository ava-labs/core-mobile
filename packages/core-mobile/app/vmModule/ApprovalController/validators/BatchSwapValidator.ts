import type { BatchApprovalParams, RpcRequest } from '@avalabs/vm-module-types'
import { RpcMethod } from 'store/rpc/types'
import type { ValidationResult } from 'features/swap/utils/swapValidation'
import { isBypassEligible, runValidateAndCapture } from './shared'
import type { ApprovalValidator } from './types'

export const batchSwapValidator: ApprovalValidator = {
  canHandle: (request: RpcRequest): boolean => {
    if (!isBypassEligible(request)) return false
    return (request.method as string) === RpcMethod.ETH_SEND_TRANSACTION_BATCH
  },

  validate: (params: BatchApprovalParams): Promise<ValidationResult> =>
    runValidateAndCapture({
      request: params.request,
      displayData: params.displayData,
      loggerTag: '[BatchSwapValidator]'
    })
}
