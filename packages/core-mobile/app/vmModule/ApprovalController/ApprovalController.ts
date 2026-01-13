import { router } from 'expo-router'
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
import { onApprove } from './onApprove'
import { onReject } from './onReject'

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
    explorerLink
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
        explorerLink
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
    const numericChainId = getChainIdFromCaip2(request.chainId)

    if (numericChainId && isAvalancheChainId(numericChainId)) {
      return // do not show success toast for avalanche transactions as we've already shown it in onTransactionPending
    }

    transactionSnackbar.success({ explorerLink, toastId: request.requestId })

    const confettiDisabled = request.context?.[RequestContext.CONFETTI_DISABLED]

    // only show confetti for in-app requests
    if (isInAppRequest(request) && !confettiDisabled) {
      setTimeout(() => {
        confetti.restart()
      }, 100)
    }

    const callback =
      request.context?.[RequestContext.CALLBACK_TRANSACTION_CONFIRMED]
    if (callback && typeof callback === 'function') {
      callback()
    }
  }

  onTransactionReverted(): void {
    transactionSnackbar.error({ error: 'Transaction reverted' })
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
            showLedgerReviewTransaction({
              network: params.network,
              onApprove: () => onApprove({ ...params, resolve, signingData }),
              onReject: (message?: string) => onReject({ resolve, message })
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
