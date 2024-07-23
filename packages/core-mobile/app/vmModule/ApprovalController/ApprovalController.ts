import { Network } from '@avalabs/chains-sdk'
import { CorePrimaryAccount } from '@avalabs/types'
import {
  Hex,
  ApprovalController as VmModuleApprovalController,
  ApprovalParams,
  ApprovalResponse,
  RpcMethod
} from '@avalabs/vm-module-types'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import {
  showTransactionErrorToast,
  showTransactionSuccessToast
} from 'utils/toast'
import { handleEthSendTransaction } from './handleEthSendTransaction'
import { handleEthSign } from './handleEthSign'

class ApprovalController implements VmModuleApprovalController {
  onTransactionConfirmed(txHash: Hex): void {
    showTransactionSuccessToast({
      message: 'Transaction Successful',
      txHash
    })
  }

  onTransactionReverted(_txHash: Hex): void {
    showTransactionErrorToast({ message: 'Transaction Reverted' })
  }

  async requestApproval({
    request,
    displayData,
    signingData
  }: ApprovalParams): Promise<ApprovalResponse> {
    return new Promise<ApprovalResponse>(resolve => {
      const onApprove = async ({
        network,
        account,
        maxFeePerGas,
        maxPriorityFeePerGas
      }: {
        network: Network
        account: CorePrimaryAccount
        maxFeePerGas?: bigint
        maxPriorityFeePerGas?: bigint
      }): Promise<void> => {
        switch (signingData.type) {
          case RpcMethod.ETH_SEND_TRANSACTION: {
            handleEthSendTransaction({
              transactionRequest: signingData.data,
              network,
              account,
              maxFeePerGas,
              maxPriorityFeePerGas,
              resolve
            })

            break
          }
          case RpcMethod.PERSONAL_SIGN:
          case RpcMethod.ETH_SIGN:
          case RpcMethod.SIGN_TYPED_DATA:
          case RpcMethod.SIGN_TYPED_DATA_V1:
          case RpcMethod.SIGN_TYPED_DATA_V3:
          case RpcMethod.SIGN_TYPED_DATA_V4: {
            handleEthSign({
              method: signingData.type,
              data: signingData.data,
              account,
              network,
              resolve
            })

            break
          }
          default:
            resolve({
              error: providerErrors.unsupportedMethod(
                'unsupported signing data type'
              )
            })
        }
      }

      const onReject = (message?: string): void => {
        const error = message
          ? rpcErrors.internal(message)
          : providerErrors.userRejectedRequest()

        resolve({
          error
        })
      }

      // TODO: use the correct fields for validation
      // if (displayData.transactionValidation) {
      //   Navigation.navigate({
      //     name: AppNavigation.Root.Wallet,
      //     params: {
      //       screen: AppNavigation.Modal.MaliciousActivityWarning,
      //       params: {
      //         title: displayData.transactionValidation.title,
      //         subTitle: displayData.transactionValidation.description,
      //         rejectButtonTitle:
      //           displayData.transactionValidation.rejectButtonTitle,
      //         onReject,
      //         onProceed: () => {
      //           Navigation.navigate({
      //             name: AppNavigation.Root.Wallet,
      //             params: {
      //               screen: AppNavigation.Modal.ApprovalPopup,
      //               params: {
      //                 request,
      //                 displayData: displayData,
      //                 signingData: signingData,
      //                 onApprove,
      //                 onReject
      //               }
      //             }
      //           })
      //         }
      //       }
      //     }
      //   })
      // } else {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.ApprovalPopup,
          params: {
            request,
            displayData: displayData,
            signingData: signingData,
            onApprove,
            onReject
          }
        }
      })
      // }
    })
  }
}

const approvalController = new ApprovalController()

export { approvalController }
