import type {
  ApprovalParams,
  BatchApprovalParams,
  RpcRequest
} from '@avalabs/vm-module-types'
import type { ValidationResult } from 'features/swap/utils/swapValidation'

export type RequestValidator = {
  canHandle: (params: ApprovalParams) => boolean
  validate: (params: ApprovalParams) => Promise<ValidationResult>
}

export type ApprovalValidator = {
  canHandle: (request: RpcRequest) => boolean
  validate: (params: BatchApprovalParams) => Promise<ValidationResult>
}
