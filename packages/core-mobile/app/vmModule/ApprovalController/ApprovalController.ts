import { router } from 'expo-router'
import LedgerService from 'services/ledger/LedgerService'
import {
  ApprovalController as VmModuleApprovalController,
  ApprovalParams,
  ApprovalResponse,
  RpcRequest,
  RequestPublicKeyParams
} from '@avalabs/vm-module-types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { transactionSnackbar } from 'new/common/utils/toast'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import {
  TxSendConfirmedEvent,
  TxSendFailedEvent
} from 'store/rpc/utils/txSendMethods'
import { RequestContext } from 'store/rpc/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { NavigationPresentationMode } from 'new/common/types'
import WalletService from 'services/wallet/WalletService'
import { Curve } from 'utils/publicKeys'
import { OnApproveParams } from 'services/walletconnectv2/walletConnectCache/types'
import { WalletType } from 'services/wallet/types'
import { showLedgerReviewTransaction } from 'features/ledger/utils'
import { promptForAppReviewAfterSuccessfulTransaction } from 'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction'
import { CONFETTI_DURATION_MS } from 'common/consts'
import { currentRouteStore } from 'new/routes/store'
import { BoundedMap } from 'common/utils/boundedMap'
import {
  isToastsAndConfettiEnabled,
  isConfettiEnabled,
  isInAppAvalancheRequest,
  isInAppReview,
  showConfetti
} from '../utils/requestContext'
import { onApprove } from './onApprove'
import { onReject } from './onReject'
import { handleLedgerErrorAndShowAlert } from './utils'

/**
 * Extracts the user's address from the WalletConnect session for the given dapp request.
 * Session namespace accounts are formatted as "namespace:chainId:address" (e.g. "eip155:1:0x...").
 * Prefer the account entry whose chainId prefix matches request.chainId; fall back to the first
 * account in the namespace if no exact chain match is found.
 */
const getDappRequestAddress = (request: RpcRequest): string => {
  const session = WalletConnectService.getSession(request.sessionId)
  const namespace = request.chainId.split(':')[0] ?? ''
  const accounts = session?.namespaces[namespace]?.accounts ?? []
  const caip2Account =
    accounts.find(a => a.startsWith(`${request.chainId}:`)) ?? accounts[0] ?? ''
  return caip2Account.split(':')[2] ?? ''
}

class ApprovalController implements VmModuleApprovalController {
  private userCancelledMap = new BoundedMap<string, boolean>(10)

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

  onTransactionPending({
    txHash: _txHash,
    request,
    explorerLink: _explorerLink
  }: {
    txHash: string
    request: RpcRequest
    explorerLink?: string
  }): void {
    if (!isToastsAndConfettiEnabled(request)) return

    if (isInAppAvalancheRequest(request)) {
      transactionSnackbar.success({
        message: 'Transaction sent'
      })

      if (isConfettiEnabled(request)) {
        showConfetti()
      }
    } else {
      transactionSnackbar.pending({ toastId: request.requestId })
    }
  }

  onTransactionConfirmed({
    txHash,
    explorerLink,
    request
  }: {
    txHash: string
    explorerLink: string
    request: RpcRequest
  }): void {
    if (!isToastsAndConfettiEnabled(request)) return

    if (isInAppReview(request)) {
      // Run the app-review prompt flow after confetti finishes
      setTimeout(() => {
        promptForAppReviewAfterSuccessfulTransaction()
      }, CONFETTI_DURATION_MS + 200)
    }

    if (isInAppAvalancheRequest(request)) {
      return // do not show success toast for in-app avalanche transactions as we've already shown it in onTransactionPending
    }

    transactionSnackbar.success({ explorerLink, toastId: request.requestId })

    // only show confetti for in-app requests
    if (isInAppRequest(request) && !confettiDisabled) {
      setTimeout(() => {
        confetti.restart()
      }, 100)
    }

    if (!isInAppRequest(request)) {
      const address = getDappRequestAddress(request)
      // VM module only calls onTransactionConfirmed for tx send methods
      const eventName = `${request.method}_confirmed` as TxSendConfirmedEvent
      AnalyticsService.captureWithEncryption(eventName, {
        dAppUrl: request.dappInfo.url,
        address,
        chainId: numericChainId ?? 0,
        txHash
      })
    }
  }

  onTransactionReverted({
    txHash,
    request
  }: {
    txHash: string
    request: RpcRequest
  }): void {
    transactionSnackbar.error({ error: 'Transaction reverted' })

    if (!isInAppRequest(request)) {
      const address = getDappRequestAddress(request)
      const chainId = getChainIdFromCaip2(request.chainId) ?? 0

      // VM module only calls onTransactionReverted for tx send methods
      const eventName = `${request.method}_failed` as TxSendFailedEvent
      AnalyticsService.captureWithEncryption(eventName, {
        dAppUrl: request.dappInfo.url,
        address,
        chainId,
        txHash
      })
    }
  }

  handleLedgerOnReject = async ({
    resolve
  }: {
    resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
  }): Promise<void> => {
    await LedgerService.disconnect()
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

  async requestApproval({
    request,
    displayData,
    signingData
  }: ApprovalParams): Promise<ApprovalResponse> {
    const requestId = request.requestId
    // Clear any previous cancellation state for this request
    this.userCancelledMap.delete(requestId)

    return new Promise<ApprovalResponse>(resolve => {
      walletConnectCache.approvalParams.set({
        request,
        displayData,
        signingData,
        onApprove: async (params: OnApproveParams) => {
          if (
            params.walletType === WalletType.LEDGER ||
            params.walletType === WalletType.LEDGER_LIVE
          ) {
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
                  onRetry: () =>
                    onApprove({
                      ...params,
                      signingData,
                      resolve: resolveWithRetry
                    }),
                  onCancel: () => {
                    this.userCancelledMap.set(requestId, true)
                    this.handleGoBackIfNeeded()
                    this.handleLedgerOnReject({ resolve })
                  }
                })
              } else {
                resolve(value)
                this.handleGoBackIfNeeded()
                this.userCancelledMap.delete(requestId)
              }
            }

            showLedgerReviewTransaction({
              rpcMethod: request.method,
              network: params.network,
              onApprove: () =>
                onApprove({
                  ...params,
                  signingData,
                  resolve: resolveWithRetry
                }),
              onReject: () => {
                this.userCancelledMap.set(requestId, true)
                this.handleLedgerOnReject({ resolve })
                this.handleGoBackIfNeeded()
              }
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
}

const approvalController = new ApprovalController()

export { approvalController }
