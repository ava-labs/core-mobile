import { router } from 'expo-router'
import { rpcErrors } from '@metamask/rpc-errors'
import LedgerService from 'services/ledger/LedgerService'
import {
  ApprovalController as VmModuleApprovalController,
  ApprovalParams,
  ApprovalResponse,
  BatchApprovalParams,
  BatchApprovalResponse,
  RpcRequest,
  RequestPublicKeyParams
} from '@avalabs/vm-module-types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { transactionSnackbar } from 'new/common/utils/toast'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import {
  isTxSendMethod,
  TxSendConfirmedEvent,
  TxSendFailedEvent
} from 'store/rpc/utils/txSendMethods'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { NavigationPresentationMode } from 'new/common/types'
import WalletService from 'services/wallet/WalletService'
import { Curve } from 'utils/publicKeys'
import { ledgerParamsStore } from 'features/ledger/store'
import { OnApproveParams } from 'services/walletconnectv2/walletConnectCache/types'
import { WalletType } from 'services/wallet/types'
import { promptForAppReviewAfterSuccessfulTransaction } from 'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction'
import { CONFETTI_DURATION_MS } from 'common/consts'
import { currentRouteStore } from 'new/routes/store'
import { BoundedMap } from 'common/utils/boundedMap'
import { getAddressForChainId } from 'store/rpc/handlers/wc_sessionRequest/utils'
import {
  isTxFeedbackEnabled,
  isConfettiEnabled,
  isInAppAvalancheRequest,
  isInAppReview,
  isSuccessToastEnabled,
  isImmediateSentToast,
  showConfetti
} from '../utils/requestContext'
import { maybeInjectSiweAlert } from '../utils/siwe/getSiweAlert'
import { onApprove } from './onApprove'
import { onReject } from './onReject'
import { handleLedgerErrorAndShowAlert } from './utils'
import { approvalValidators, requestValidators } from './validators'

type BatchSigningContext = {
  walletId: string
  walletType: WalletType
  accountIndex: number
  network: Parameters<typeof WalletService.sign>[0]['network']
}

const readBatchSigningContext = (
  request: RpcRequest
): BatchSigningContext | undefined => {
  const ctx = request.context as Record<string, unknown> | undefined
  if (!ctx) return undefined
  const walletId = ctx.walletId
  const walletType = ctx.walletType
  const accountIndex = ctx.accountIndex
  const network = ctx.network
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

class ApprovalController implements VmModuleApprovalController {
  private userCancelledMap = new BoundedMap<string, boolean>(10)
  private signingAddressMap = new BoundedMap<string, string>(10)

  async requestPublicKey({
    secretId,
    derivationPath,
    curve
  }: RequestPublicKeyParams): Promise<string> {
    const { walletId, walletType } = JSON.parse(secretId)

    return WalletService.getPublicKeyFor({
      walletId,
      walletType: walletType,
      derivationPath,
      curve: curve as Curve
    })
  }

  onTransactionPending = ({
    txHash: _txHash,
    request,
    explorerLink: _explorerLink
  }: {
    txHash: string
    request: RpcRequest
    explorerLink?: string
  }): void => {
    if (!isTxFeedbackEnabled(request)) return

    if (isInAppAvalancheRequest(request)) {
      transactionSnackbar.success({
        message: 'Transaction sent'
      })

      if (isConfettiEnabled(request)) {
        showConfetti()
      }
    } else if (isImmediateSentToast(request)) {
      transactionSnackbar.success({ message: 'Transaction sent' })
    } else {
      transactionSnackbar.pending({ toastId: request.requestId })
    }
  }

  onTransactionConfirmed = ({
    txHash,
    explorerLink,
    request
  }: {
    txHash: string
    explorerLink: string
    request: RpcRequest
  }): void => {
    if (!isInAppRequest(request) && isTxSendMethod(request.method)) {
      const address = this.signingAddressMap.get(request.requestId) ?? ''
      this.signingAddressMap.delete(request.requestId)
      const eventName = `${request.method}_confirmed` as TxSendConfirmedEvent
      AnalyticsService.capture(eventName, {
        encrypted: {
          dAppUrl: request.dappInfo.url,
          address,
          chainId: request.chainId,
          txHash
        }
      })
    }

    if (!isTxFeedbackEnabled(request)) return

    if (isInAppReview(request)) {
      // Run the app-review prompt flow after confetti finishes
      setTimeout(() => {
        promptForAppReviewAfterSuccessfulTransaction()
      }, CONFETTI_DURATION_MS + 200)
    }

    if (isInAppAvalancheRequest(request)) {
      return // do not show success toast for in-app avalanche transactions as we've already shown it in onTransactionPending
    }

    if (isSuccessToastEnabled(request)) {
      transactionSnackbar.success({ explorerLink, toastId: request.requestId })
    }

    // only show confetti for in-app requests
    if (isInAppRequest(request) && isConfettiEnabled(request)) {
      showConfetti()
    }
  }

  onTransactionReverted = ({
    txHash,
    request
  }: {
    txHash: string
    request: RpcRequest
  }): void => {
    transactionSnackbar.error({ error: 'Transaction reverted' })

    if (!isInAppRequest(request) && isTxSendMethod(request.method)) {
      const address = this.signingAddressMap.get(request.requestId) ?? ''
      this.signingAddressMap.delete(request.requestId)
      const eventName = `${request.method}_failed` as TxSendFailedEvent
      AnalyticsService.capture(eventName, {
        encrypted: {
          dAppUrl: request.dappInfo.url,
          address,
          chainId: request.chainId,
          txHash
        }
      })
    }
  }

  handleLedgerOnReject = async ({
    resolve
  }: {
    resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
  }): Promise<void> => {
    ledgerParamsStore.getState().setReviewTransactionParams(null)
    await LedgerService.disconnect().catch()
    onReject({ resolve })
  }

  handleGoBackIfNeeded = (): void => {
    const currentRoute = currentRouteStore.getState().currentRoute
    if (
      (currentRoute?.endsWith('ledgerReviewTransaction') ||
        currentRoute?.endsWith('approval')) &&
      router.canGoBack()
    ) {
      router.back()
    }
  }

  private cacheSigningAddress(
    requestId: string,
    chainId: string,
    account: OnApproveParams['account']
  ): void {
    const address = getAddressForChainId(chainId, account)
    if (address) {
      this.signingAddressMap.set(requestId, address)
    }
  }

  private handleLedgerApproval({
    requestId,
    request,
    params,
    signingData,
    resolve
  }: {
    requestId: string
    request: ApprovalParams['request']
    params: OnApproveParams
    signingData: ApprovalParams['signingData']
    resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
  }): void {
    const resolveWithRetry = (
      value: ApprovalResponse | PromiseLike<ApprovalResponse>
    ): void => {
      if ('error' in value) {
        // Don't show alert if user explicitly cancelled
        if (this.userCancelledMap.get(requestId)) {
          this.userCancelledMap.delete(requestId)
          return
        }

        handleLedgerErrorAndShowAlert({
          error: value.error,
          network: params.network,
          rpcMethod: request.method,
          onRetry: () => {
            // Guard: if the approval sheet was dismissed while the alert was
            // visible, userCancelledMap will be set — don't retry in that case.
            if (this.userCancelledMap.get(requestId)) {
              this.userCancelledMap.delete(requestId)
              return
            }
            onApprove({
              ...params,
              signingData,
              resolve: resolveWithRetry
            })
          },
          onCancel: () => {
            this.userCancelledMap.set(requestId, true)
            this.handleGoBackIfNeeded()
            this.handleLedgerOnReject({ resolve })
          }
        })
      } else {
        resolve(value)
        ledgerParamsStore.getState().setReviewTransactionParams(null)
        this.handleGoBackIfNeeded()
        this.userCancelledMap.delete(requestId)
      }
    }

    ledgerParamsStore.getState().setReviewTransactionParams({
      rpcMethod: request.method,
      network: params.network,
      onApprove: () =>
        onApprove({
          ...params,
          signingData,
          resolve: resolveWithRetry
        }),
      onReject: (_message?: string) => {
        this.userCancelledMap.set(requestId, true)
        this.handleLedgerOnReject({ resolve })
        this.handleGoBackIfNeeded()
      }
    })
  }

  // Returns null when the validator defers to the manual modal.
  // EvmSigner.sign only attaches SWAP_AUTO_APPROVE when tx.maxFeePerGas
  // is already filled — so signingData.data is broadcast-ready here.
  private runRequestValidator = async (
    validator: typeof requestValidators[number],
    params: ApprovalParams
  ): Promise<ApprovalResponse | null> => {
    const verdict = await validator.validate(params)
    if (verdict.isValid) {
      const signingContext = readBatchSigningContext(params.request)
      if (!signingContext) {
        return {
          error: rpcErrors.internal({
            message:
              'requestApproval: validator approved but signing context missing from request'
          })
        }
      }
      try {
        const signedData = await WalletService.sign({
          walletId: signingContext.walletId,
          walletType: signingContext.walletType,
          transaction: (
            params.signingData as {
              data: Parameters<typeof WalletService.sign>[0]['transaction']
            }
          ).data,
          accountIndex: signingContext.accountIndex,
          network: signingContext.network,
          sentrySpanName: 'sign-transaction'
        })
        return { signedData }
      } catch (err) {
        return {
          error: rpcErrors.internal({
            message:
              err instanceof Error
                ? err.message
                : 'requestApproval: bypass sign failed'
          })
        }
      }
    }

    if (verdict.requiresManualApproval) return null

    return {
      error: rpcErrors.invalidRequest({
        message:
          verdict.reason || 'requestApproval: blocked by safety validation'
      })
    }
  }

  async requestApproval(params: ApprovalParams): Promise<ApprovalResponse> {
    const { request, displayData, signingData } = params
    const requestId = request.requestId
    this.userCancelledMap.delete(requestId)

    // Synchronous find keeps the common (no-validator-matches) path
    // microtask-free so callers that observe walletConnectCache.set +
    // router.navigate synchronously still see them on the same tick.
    const validator = requestValidators.find(v => v.canHandle(params))
    if (validator) {
      const bypassResult = await this.runRequestValidator(validator, params)
      if (bypassResult) return bypassResult
    }

    const enrichedDisplayData = maybeInjectSiweAlert({
      request,
      signingData,
      displayData
    })

    return new Promise<ApprovalResponse>(resolve => {
      walletConnectCache.approvalParams.set({
        request,
        displayData: enrichedDisplayData,
        signingData,
        onApprove: async (params: OnApproveParams) => {
          if (!isInAppRequest(request) && isTxSendMethod(request.method)) {
            this.cacheSigningAddress(requestId, request.chainId, params.account)
          }

          if (
            params.walletType === WalletType.LEDGER ||
            params.walletType === WalletType.LEDGER_LIVE
          ) {
            this.handleLedgerApproval({
              requestId,
              request,
              params,
              signingData,
              resolve
            })
          } else {
            return onApprove({ ...params, resolve, signingData })
          }
        },
        onReject: (message?: string) => onReject({ resolve, message })
      })

      router.navigate({
        pathname: '/approval',
        params: {
          presentationMode: isInAppRequest(request)
            ? NavigationPresentationMode.FORM_SHEET
            : undefined
        }
      })
    })
  }

  // On requiresManualApproval, returns a structured error with the
  // quickSwapsManualReview marker that EvmSigner.signBatch detects to
  // re-issue each tx through the per-tx approval modal.
  async requestBatchApproval(
    params: BatchApprovalParams
  ): Promise<BatchApprovalResponse> {
    const { request, signingRequests } = params
    const validator = approvalValidators.find(v => v.canHandle(request))
    if (!validator) {
      return {
        error: rpcErrors.internal({
          message:
            'eth_sendTransactionBatch: no validator matched the batch request'
        })
      }
    }

    const verdict = await validator.validate(params)
    if (verdict.isValid) {
      const signingContext = readBatchSigningContext(request)
      if (!signingContext) {
        return {
          error: rpcErrors.internal({
            message:
              'eth_sendTransactionBatch: signing context missing from request'
          })
        }
      }
      try {
        const signedTxs: { signedData: string }[] = []
        for (const sr of signingRequests) {
          const signedData = await WalletService.sign({
            walletId: signingContext.walletId,
            walletType: signingContext.walletType,
            transaction: sr.signingData.data,
            accountIndex: signingContext.accountIndex,
            network: signingContext.network,
            sentrySpanName: 'sign-transaction'
          })
          signedTxs.push({ signedData })
        }
        return { result: signedTxs }
      } catch (err) {
        return {
          error: rpcErrors.internal({
            message:
              err instanceof Error
                ? err.message
                : 'eth_sendTransactionBatch: batch sign failed'
          })
        }
      }
    }

    if (verdict.requiresManualApproval) {
      const detail = verdict.reason || 'unknown reason'
      return {
        error: rpcErrors.internal({
          message: `Quick Swaps requires manual review for this swap (${detail}).`,
          data: {
            quickSwapsManualReview: true,
            code: verdict.code,
            reason: verdict.reason
          }
        })
      }
    }

    return {
      error: rpcErrors.invalidRequest({
        message:
          verdict.reason ||
          'eth_sendTransactionBatch: blocked by safety validation'
      })
    }
  }
}

const approvalController = new ApprovalController()

export { approvalController }
