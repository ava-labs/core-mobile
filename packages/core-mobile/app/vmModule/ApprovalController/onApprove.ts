import { btcSendTransaction } from 'vmModule/handlers/btcSendTransaction'
import {
  ApprovalResponse,
  RpcMethod,
  SigningData
} from '@avalabs/vm-module-types'
import { btcSignTransaction } from 'vmModule/handlers/btcSignTransaction'
import { ethSendTransaction } from 'vmModule/handlers/ethSendTransaction'
import { signMessage } from 'vmModule/handlers/signMessage'
import { avalancheSendTransaction } from 'vmModule/handlers/avalancheSendTransaction'
import { avalancheSignTransaction } from 'vmModule/handlers/avalancheSignTransaction'
import { solanaSendTransaction } from 'vmModule/handlers/solanaSendTransaction'
import { solanaSignMessage } from 'vmModule/handlers/solanaSignMessage'
import { solanaSignTransaction } from 'vmModule/handlers/solanaSignTransaction'
import { providerErrors } from '@metamask/rpc-errors'
import { OnApproveParams } from 'services/walletconnectv2/walletConnectCache/types'

export const onApprove = async ({
  walletId,
  walletType,
  network,
  account,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasLimit,
  overrideData,
  signingData,
  resolve
}: OnApproveParams & {
  signingData: SigningData
  resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
}): Promise<void> => {
  switch (signingData.type) {
    case RpcMethod.BITCOIN_SEND_TRANSACTION: {
      btcSendTransaction({
        walletId,
        walletType,
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
        walletId,
        walletType,
        transactionData: signingData.data,
        account,
        network,
        resolve
      })

      break
    }
    case RpcMethod.ETH_SEND_TRANSACTION: {
      ethSendTransaction({
        walletId,
        walletType,
        transactionRequest: signingData.data,
        network,
        account,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit,
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
        walletId,
        walletType,
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
        walletId,
        walletType,
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
        walletId,
        walletType,
        unsignedTxJson: signingData.unsignedTxJson,
        ownSignatureIndices: signingData.ownSignatureIndices,
        account,
        network,
        resolve
      })
      break
    }

    case RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION: {
      solanaSendTransaction({
        walletId,
        walletType,
        transactionData: signingData.data,
        account,
        network,
        resolve
      })
      break
    }
    case RpcMethod.SOLANA_SIGN_MESSAGE: {
      solanaSignMessage({
        walletId,
        walletType,
        message: {
          pubkey: signingData.account,
          message: signingData.data
        },
        account,
        network,
        resolve
      })
      break
    }
    case RpcMethod.SOLANA_SIGN_TRANSACTION: {
      solanaSignTransaction({
        walletId,
        walletType,
        transactionData: {
          account: account.addressSVM,
          message: signingData.data
        },
        account,
        network,
        resolve
      })
      break
    }
    default:
      resolve({
        error: providerErrors.unsupportedMethod('unsupported signing data type')
      })
  }
}
