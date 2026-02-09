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
import { transactionSnackbar } from 'new/common/utils/toast'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { RequestContext } from 'store/rpc/types'
import { NavigationPresentationMode } from 'new/common/types'
import WalletService from 'services/wallet/WalletService'
import { Curve } from 'utils/publicKeys'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { OnApproveParams } from 'services/walletconnectv2/walletConnectCache/types'
import { WalletType } from 'services/wallet/types'
import { showLedgerReviewTransaction } from 'features/ledger/utils'
import { promptForAppReviewAfterSuccessfulTransaction } from 'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction'
import { CONFETTI_DURATION_MS } from 'common/consts'
import { currentRouteStore } from 'new/routes/store'
import { onApprove } from './onApprove'
import { onReject } from './onReject'
import { handleLedgerErrorAndShowAlert } from './utils'

class ApprovalController implements VmModuleApprovalController {
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
    const numericChainId = getChainIdFromCaip2(request.chainId)

    if (
      numericChainId &&
      isAvalancheChainId(numericChainId) &&
      isInAppRequest(request)
    ) {
      const confettiDisabled =
        request.context?.[RequestContext.CONFETTI_DISABLED]

      transactionSnackbar.success({
        message: 'Transaction sent'
      })

      if (!confettiDisabled) {
        setTimeout(() => {
          confetti.restart()
        }, 100)
      }
    } else {
      transactionSnackbar.pending({ toastId: request.requestId })
    }
  }

  onTransactionConfirmed({
    explorerLink,
    request
  }: {
    explorerLink: string
    request: RpcRequest
  }): void {
    const onConfirmed = request.context?.[RequestContext.ON_CONFIRMED]
    if (typeof onConfirmed === 'function') {
      onConfirmed()
    }

    const inAppReview = request.context?.[RequestContext.IN_APP_REVIEW]

    if (inAppReview) {
      // Run the app-review prompt flow after confetti finishes
      setTimeout(() => {
        promptForAppReviewAfterSuccessfulTransaction()
      }, CONFETTI_DURATION_MS + 200)
    }

    const numericChainId = getChainIdFromCaip2(request.chainId)

    if (
      numericChainId &&
      isAvalancheChainId(numericChainId) &&
      isInAppRequest(request)
    ) {
      return // do not show success toast for in-app avalanche transactions as we've already shown it in onTransactionPending
    }

    transactionSnackbar.success({ explorerLink, toastId: request.requestId })

    const confettiDisabled = request.context?.[RequestContext.CONFETTI_DISABLED]

    // only show confetti for in-app requests
    if (isInAppRequest(request) && !confettiDisabled) {
      setTimeout(() => {
        confetti.restart()
      }, 100)
    }
  }

  onTransactionReverted({
    txHash: _txHash,
    request
  }: {
    txHash: string
    request: RpcRequest
  }): void {
    const onReverted = request.context?.[RequestContext.ON_REVERTED]
    if (typeof onReverted === 'function') {
      onReverted()
    }
    transactionSnackbar.error({ error: 'Transaction reverted' })
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
                    this.handleGoBackIfNeeded()
                    this.handleLedgerOnReject({ resolve })
                  }
                })
              } else {
                resolve(value)
                this.handleGoBackIfNeeded()
              }
            }

            showLedgerReviewTransaction({
              network: params.network,
              onApprove: () =>
                onApprove({
                  ...params,
                  signingData,
                  resolve: resolveWithRetry
                }),
              onReject: () => {
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
        // @ts-ignore
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
