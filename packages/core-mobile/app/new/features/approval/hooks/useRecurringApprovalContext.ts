import { useEffect, useMemo } from 'react'
import type { RpcRequest } from '@avalabs/vm-module-types'
import Logger from 'utils/Logger'
import {
  readRecurringSwapApprovalContext,
  type RecurringSwapApprovalContext
} from 'vmModule/ApprovalController/validators/shared'

type ApprovalRpcRequest = Parameters<typeof readRecurringSwapApprovalContext>[0]

type Result = {
  recurringContext: RecurringSwapApprovalContext | undefined
  isRecurringContextMalformed: boolean
}

// EvmSigner injects the RECURRING_SWAP context onto the request when the
// SDK's synthetic Quote carries a `markr-recurring*` aggregator id. If the
// payload is malformed (mobile-side producer bug) the validator throws and
// we set `isRecurringContextMalformed: true` so the caller can render `null`
// instead of a generic-swap modal that is actually backing a recurring
// schedule. The reject + navigation happens here so every consumer stays
// safe by default.
export function useRecurringApprovalContext(
  request: RpcRequest | ApprovalRpcRequest,
  onReject: (reason?: string) => void
): Result {
  const read = useMemo(() => {
    try {
      return {
        ok: true as const,
        ctx: readRecurringSwapApprovalContext(request as ApprovalRpcRequest)
      }
    } catch (err) {
      return { ok: false as const, err: err as Error }
    }
  }, [request])

  useEffect(() => {
    if (!read.ok) {
      Logger.error(
        '[ApprovalScreen] malformed RECURRING_SWAP context; rejecting',
        read.err
      )
      onReject('Recurring swap details could not be verified')
    }
  }, [read, onReject])

  return {
    recurringContext: read.ok ? read.ctx : undefined,
    isRecurringContextMalformed: !read.ok
  }
}
