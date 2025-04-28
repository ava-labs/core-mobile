import { router } from 'expo-router'
import { Network } from '@avalabs/core-chains-sdk'
import { CorePrimaryAccount } from '@avalabs/types'
import {
  Hex,
  ApprovalController as VmModuleApprovalController,
  ApprovalParams,
  ApprovalResponse,
  RpcMethod
} from '@avalabs/vm-module-types'
import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import { btcSignTransaction } from 'vmModule/handlers/btcSignTransaction'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { transactionSnackbar } from 'new/common/utils/toast'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { NavigationPresentationMode } from 'new/common/types'
import { avalancheSignTransaction } from '../handlers/avalancheSignTransaction'
import { ethSendTransaction } from '../handlers/ethSendTransaction'
import { signMessage } from '../handlers/signMessage'
import { btcSendTransaction } from '../handlers/btcSendTransaction'
import { avalancheSendTransaction } from '../handlers/avalancheSendTransaction'

class ApprovalController implements VmModuleApprovalController {
  requestPublicKey(): Promise<Hex> {
    return Promise.reject(providerErrors.unsupportedMethod('requestPublicKey'))
  }

  onTransactionPending(): void {
    transactionSnackbar.pending()
  }

  onTransactionConfirmed({
    explorerLink
  }: {
    explorerLink: string
    requestId: string
  }): void {
    transactionSnackbar.success({ explorerLink })
  }

  onTransactionReverted(): void {
    transactionSnackbar.error({ message: 'Transaction reverted' })
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
        maxPriorityFeePerGas,
        overrideData
      }: {
        network: Network
        account: CorePrimaryAccount
        maxFeePerGas?: bigint
        maxPriorityFeePerGas?: bigint
        overrideData?: string
      }): Promise<void> => {
        switch (signingData.type) {
          case RpcMethod.BITCOIN_SEND_TRANSACTION: {
            btcSendTransaction({
              transactionData: signingData.data,
              finalFeeRate: Number(maxFeePerGas || 0),
              account,
              network,
              resolve
            })

            break
          }
          case RpcMethod.BITCOIN_SIGN_TRANSACTION: {
            btcSignTransaction({
              transactionData: signingData.data,
              account,
              network,
              resolve
            })

            break
          }
          case RpcMethod.ETH_SEND_TRANSACTION: {
            ethSendTransaction({
              transactionRequest: signingData.data,
              network,
              account,
              maxFeePerGas,
              maxPriorityFeePerGas,
              overrideData,
              resolve
            })
            break
          }
          case RpcMethod.PERSONAL_SIGN:
          case RpcMethod.ETH_SIGN:
          case RpcMethod.SIGN_TYPED_DATA:
          case RpcMethod.SIGN_TYPED_DATA_V1:
          case RpcMethod.SIGN_TYPED_DATA_V3:
          case RpcMethod.SIGN_TYPED_DATA_V4:
          case RpcMethod.AVALANCHE_SIGN_MESSAGE: {
            signMessage({
              method: signingData.type,
              data: signingData.data,
              account,
              network,
              resolve
            })
            break
          }
          case RpcMethod.AVALANCHE_SEND_TRANSACTION: {
            avalancheSendTransaction({
              unsignedTxJson: signingData.unsignedTxJson,
              vm: signingData.vm,
              externalIndices: signingData.externalIndices ?? [],
              internalIndices: signingData.internalIndices ?? [],
              account,
              isTestnet: network.isTestnet,
              resolve
            })
            break
          }
          case RpcMethod.AVALANCHE_SIGN_TRANSACTION: {
            avalancheSignTransaction({
              unsignedTxJson: signingData.unsignedTxJson,
              ownSignatureIndices: signingData.ownSignatureIndices,
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

      walletConnectCache.approvalParams.set({
        request,
        displayData,
        signingData,
        onApprove,
        onReject
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
