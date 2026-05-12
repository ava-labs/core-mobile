import { RpcMethod } from 'store/rpc/types'
import { isBypassEligible, runValidateAndCapture } from './shared'
import type {
  RequestValidationParams,
  RequestValidator,
  ValidationResult
} from './types'

export const swapValidator: RequestValidator = {
  canHandle: (params: RequestValidationParams): boolean => {
    if (!isBypassEligible(params.request)) return false
    return (
      (params.signingData?.type as string) === RpcMethod.ETH_SEND_TRANSACTION
    )
  },

  validate: (params: RequestValidationParams): Promise<ValidationResult> =>
    runValidateAndCapture({
      request: params.request,
      displayData: params.displayData,
      loggerTag: '[SwapValidator]'
    })
}
