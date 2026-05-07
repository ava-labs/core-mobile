import type {
  ApprovalParams,
  BatchApprovalParams,
  RpcRequest
} from '@avalabs/vm-module-types'
import type { ValidationResult } from 'features/swap/utils/swapValidation'

export type { ValidationResult } from 'features/swap/utils/swapValidation'

export type RequestValidationParams = ApprovalParams

export type BatchValidationParams = BatchApprovalParams

export type RequestValidator = {
  canHandle: (params: RequestValidationParams) => boolean
  validate: (params: RequestValidationParams) => Promise<ValidationResult>
}

export type ApprovalValidator = {
  canHandle: (request: RpcRequest) => boolean
  validate: (params: BatchValidationParams) => Promise<ValidationResult>
}
