import { Network } from '@avalabs/chains-sdk'
import { CorePrimaryAccount } from '@avalabs/types'
import {
  Hex,
  ApprovalController as VmModuleApprovalController,
  ApprovalParams,
  ApprovalResponse,
  SigningDataType
} from '@avalabs/vm-module-types'
import AppNavigation from 'navigation/AppNavigation'
import WalletService from 'services/wallet/WalletService'
import * as Navigation from 'utils/Navigation'
import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import {
  showTransactionErrorToast,
  showTransactionSuccessToast
} from 'utils/toast'

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
        maxFeePerGas: bigint
        maxPriorityFeePerGas: bigint
      }): Promise<void> => {
        switch (signingData.type) {
          case SigningDataType.EVM_TRANSACTION: {
            const { gasLimit, type, nonce, data, from, to, value } =
              signingData.data

            const transaction = {
              nonce,
              type,
              chainId: network.chainId,
              maxFeePerGas,
              maxPriorityFeePerGas,
              gasLimit,
              data,
              from,
              to,
              value
            }

            try {
              const signedTx = await WalletService.sign({
                transaction,
                accountIndex: account.index,
                network
              })

              resolve({
                result: signedTx as `0x${string}`
              })
            } catch (error) {
              resolve({
                error: rpcErrors.internal('failed to sign transaction')
              })
            }

            break
          }

          case SigningDataType.EVM_MESSAGE_ETH_SIGN: // to be implemented
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
