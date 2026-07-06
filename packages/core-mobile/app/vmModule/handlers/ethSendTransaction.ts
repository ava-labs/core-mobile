import { Network } from '@avalabs/core-chains-sdk'
import { ApprovalResponse } from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { TransactionRequest } from 'ethers'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'
import { buildEvmTransaction } from 'vmModule/utils/buildEvmTransaction'

export const ethSendTransaction = async ({
  transactionRequest,
  network,
  account,
  walletId,
  walletType,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasLimit,
  overrideData,
  onSigned,
  resolve
}: {
  transactionRequest: TransactionRequest
  network: Network
  account: Account
  walletId: string
  walletType: WalletType
  maxFeePerGas: bigint | undefined
  maxPriorityFeePerGas: bigint | undefined
  gasLimit: number | undefined
  overrideData: string | undefined
  onSigned?: () => Promise<boolean>
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  const transaction = buildEvmTransaction({
    transactionRequest,
    chainId: network.chainId,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit,
    overrideData
  })

  try {
    const signedTx = await WalletService.sign({
      walletId,
      walletType,
      transaction,
      accountIndex: account.index,
      network,
      fromAddress: account.addressC
    })

    // If onSigned is provided (gasless flow), call it after signing
    // but before broadcasting. If it returns false or throws (funding
    // failed), don't broadcast — the caller handles the error UI.
    if (onSigned) {
      try {
        const shouldBroadcast = await onSigned()
        if (!shouldBroadcast) {
          // Gasless funding declined without throwing (e.g. gas station
          // returned DO_NOT_RETRY). The upstream Promise chain
          // (ApprovalController → vm-module onRpcRequest → EvmSigner →
          // executeFirstFill) is awaiting this resolve — without it the
          // recurring-swap submit hangs indefinitely.
          resolve({
            error: rpcErrors.internal({
              message: 'Gasless funding failed'
            })
          })
          return
        }
      } catch (error) {
        Logger.error(
          `[ethSendTransaction] onSigned FAILED: ${
            error instanceof Error ? error.message : String(error)
          }`,
          error
        )
        resolve({
          error: rpcErrors.internal({
            message: 'Failed to complete gasless transaction funding',
            data: { cause: error }
          })
        })
        return
      }
    }

    resolve({
      signedData: signedTx
    })
  } catch (error) {
    Logger.error(
      `[ethSendTransaction] signing FAILED - walletType: ${walletType}, error: ${
        error instanceof Error ? error.message : String(error)
      }`,
      error
    )
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign evm transaction',
        data: { cause: error }
      })
    })
  }
}
