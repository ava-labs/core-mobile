import type { ApprovalValidator, RequestValidator } from './types'
import { batchSwapValidator } from './BatchSwapValidator'
import { swapValidator } from './SwapValidator'

export const requestValidators: RequestValidator[] = [swapValidator]

export const approvalValidators: ApprovalValidator[] = [batchSwapValidator]
