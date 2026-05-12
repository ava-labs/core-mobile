import type { ApprovalParams } from '@avalabs/vm-module-types'
import { RpcMethod } from 'store/rpc/types'
import type { ValidationResult } from 'features/swap/utils/swapValidation'
import { isBypassEligible, runValidateAndCapture } from './shared'
import type { RequestValidator } from './types'

export const swapValidator: RequestValidator = {
  canHandle: (params: ApprovalParams): boolean => {
    if (!isBypassEligible(params.request)) return false
    return (
      (params.signingData?.type as string) === RpcMethod.ETH_SEND_TRANSACTION
    )
  },

  validate: (params: ApprovalParams): Promise<ValidationResult> =>
    runValidateAndCapture({
      request: params.request,
      displayData: params.displayData,
      loggerTag: '[SwapValidator]'
    })
}
