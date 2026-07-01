import { rpcErrors } from '@metamask/rpc-errors'
import {
  AlertType,
  ApprovalParams,
  ApprovalResponse,
  BatchApprovalParams,
  BatchApprovalResponse,
  RpcRequest,
  SigningData_EthSendTx
} from '@avalabs/vm-module-types'
import { RequestContext } from 'store/rpc/types'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { approvalValidators, requestValidators } from './validators'

// All Quick Swaps bypass logic lives here so ApprovalController stays
// focused on the SDK lifecycle. The bypass path needs to:
//   1. Run the matching validator
//   2. On isValid:true — sign each tx with the request's signing context
//      and return the broadcast-ready signed RLP to the EVM module
//   3. On requiresManualApproval — surface the reason via a fallback
//      Alert and let the caller fall through to the manual modal
//      (single-tx) or return a marker error the signer detects (batch)
//   4. On hard reject — return an invalidRequest error

type BatchSigningContext = {
  walletId: string
  walletType: WalletType
  accountIndex: number
  network: Parameters<typeof WalletService.sign>[0]['network']
}

type Transaction = Parameters<typeof WalletService.sign>[0]['transaction']

const readCtx = (request: RpcRequest): Record<string, unknown> | undefined =>
  request.context as Record<string, unknown> | undefined

const readManualReviewReason = (request: RpcRequest): string | undefined => {
  const reason =
    readCtx(request)?.[RequestContext.QUICK_SWAPS_MANUAL_REVIEW_REASON]
  return typeof reason === 'string' && reason.length > 0 ? reason : undefined
}

const readBatchSigningContext = (
  request: RpcRequest
): BatchSigningContext | undefined => {
  const ctx = readCtx(request)
  if (!ctx) return undefined
  const { walletId, walletType, accountIndex, network } = ctx
  if (
    typeof walletId !== 'string' ||
    typeof walletType !== 'string' ||
    typeof accountIndex !== 'number' ||
    !network
  ) {
    return undefined
  }
  return {
    walletId,
    walletType: walletType as WalletType,
    accountIndex,
    network: network as BatchSigningContext['network']
  }
}

// Skipped when an alert is already present (e.g. Blockaid Warning) to
// avoid clobbering it. The title is baked into description with `\n`
// because ApprovalScreen only renders `details.description`.
const injectFallbackAlert = (
  displayData:
    | ApprovalParams['displayData']
    | BatchApprovalParams['displayData'],
  reason: string | undefined
): void => {
  if (displayData.alert) return
  const description = reason
    ? `Manual approval required\n${reason}`
    : 'Manual approval required\nQuick Swaps could not auto-approve this swap.'
  displayData.alert = {
    type: AlertType.WARNING,
    details: {
      title: 'Manual approval required',
      description
    }
  }
}

// Signs each tx in order with the request's bypass context. Returns
// an error envelope on missing context or sign throw so callers can
// surface a consistently-labelled rpcErrors.internal.
const signWithBypassContext = async (
  request: RpcRequest,
  transactions: readonly Transaction[],
  errorLabel: string
): Promise<
  | { signedTxs: { signedData: string }[] }
  | { error: ReturnType<typeof rpcErrors.internal> }
> => {
  const ctx = readBatchSigningContext(request)
  if (!ctx) {
    return {
      error: rpcErrors.internal({
        message: `${errorLabel}: signing context missing from request`
      })
    }
  }
  try {
    const signedTxs: { signedData: string }[] = []
    for (const transaction of transactions) {
      const signedData = await WalletService.sign({
        ...ctx,
        transaction,
        sentrySpanName: 'sign-transaction'
      })
      signedTxs.push({ signedData })
    }
    return { signedTxs }
  } catch (err) {
    return {
      error: rpcErrors.internal({
        message:
          err instanceof Error ? err.message : `${errorLabel}: sign failed`
      })
    }
  }
}

type RequestValidator = typeof requestValidators[number]

// Sync — keeps the common (no-validator) path microtask-free so the
// caller in ApprovalController.requestApproval can synchronously
// navigate to the manual modal in the same tick. Side effect: if no
// validator matches, surface any batch-fallback manual-review reason
// the EvmSigner left behind in context.
export const findRequestValidator = (
  params: ApprovalParams
): RequestValidator | undefined => {
  const validator = requestValidators.find(v => v.canHandle(params))
  if (!validator) {
    const manualReviewReason = readManualReviewReason(params.request)
    if (manualReviewReason) {
      injectFallbackAlert(params.displayData, manualReviewReason)
    }
  }
  return validator
}

// Async — runs the (already matched) validator and either returns a
// resolved ApprovalResponse, or null when the validator defers to the
// manual modal (in which case the fallback alert has been injected and
// the caller falls through). EvmSigner.sign only attaches
// SWAP_AUTO_APPROVE when tx.maxFeePerGas is filled, so
// signingData.data is broadcast-ready here.
export const runRequestValidatorBypass = async (
  validator: RequestValidator,
  params: ApprovalParams
): Promise<ApprovalResponse | null> => {
  const verdict = await validator.validate(params)

  if (verdict.isValid) {
    // canHandle guarantees signingData.type === ETH_SEND_TRANSACTION,
    // i.e. shape is SigningData_EthSendTx.
    const tx = (params.signingData as SigningData_EthSendTx).data as Transaction
    const result = await signWithBypassContext(
      params.request,
      [tx],
      'requestApproval'
    )
    if ('error' in result) return result
    // signWithBypassContext signs each input tx in order; we passed
    // exactly one, so signedTxs[0] is guaranteed.
    return { signedData: result.signedTxs[0]!.signedData }
  }

  if (verdict.requiresManualApproval) {
    injectFallbackAlert(params.displayData, verdict.reason)
    return null
  }

  return {
    error: rpcErrors.invalidRequest({
      message: verdict.reason || 'requestApproval: blocked by safety validation'
    })
  }
}

export type BatchApprovalDecision =
  | { kind: 'signed'; response: BatchApprovalResponse }
  | { kind: 'reject'; response: BatchApprovalResponse }
  | { kind: 'manual' }

// Thin, exported wrapper over the existing per-tx signing loop so the
// ApprovalController's manual-batch path can sign the batch itself.
export const signBatchRequests = async (
  request: RpcRequest,
  transactions: readonly Transaction[],
  errorLabel: string
): Promise<
  | { signedTxs: { signedData: string }[] }
  | { error: ReturnType<typeof rpcErrors.internal> }
> => signWithBypassContext(request, transactions, errorLabel)

// Decision function used by ApprovalController.requestBatchApproval to pick
// between auto-approve (signed), hard reject, and opening the manual screen.
export const evaluateBatchApproval = async (
  params: BatchApprovalParams
): Promise<BatchApprovalDecision> => {
  const { request, signingRequests } = params
  const validator = approvalValidators.find(v => v.canHandle(request))

  // No validator (e.g. recurring first-fill: no SWAP_AUTO_APPROVE context) ->
  // manual screen. Replaces the old "no validator matched" error.
  if (!validator) return { kind: 'manual' }

  const verdict = await validator.validate(params)

  if (verdict.isValid) {
    const result = await signWithBypassContext(
      request,
      signingRequests.map(sr => sr.signingData.data),
      'eth_sendTransactionBatch'
    )
    if ('error' in result) return { kind: 'reject', response: result }
    return { kind: 'signed', response: { result: result.signedTxs } }
  }

  if (verdict.requiresManualApproval) {
    injectFallbackAlert(params.displayData, verdict.reason)
    return { kind: 'manual' }
  }

  return {
    kind: 'reject',
    response: {
      error: rpcErrors.invalidRequest({
        message:
          verdict.reason ||
          'eth_sendTransactionBatch: blocked by safety validation'
      })
    }
  }
}
