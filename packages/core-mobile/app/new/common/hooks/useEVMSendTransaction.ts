import { useCallback } from 'react'
import { Address, Hex } from 'viem'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'

type UseEVMSendTransactionProps = {
  network: Network | undefined
  provider: JsonRpcBatchInternal | undefined
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

type EVMSendTransactionParams = {
  contractAddress: Address
  encodedData: Hex
  value?: Hex // Optional value for native token transfers (e.g., AVAX)
}

export const useEVMSendTransaction = ({
  network,
  provider,
  onSuccess,
  onError
}: UseEVMSendTransactionProps): {
  sendTransaction: (params: EVMSendTransactionParams) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  const sendTransaction = useCallback(
    async ({
      contractAddress,
      encodedData,
      value
    }: EVMSendTransactionParams) => {
      if (!provider) {
        throw new Error('No provider found')
      }

      if (!address) {
        throw new Error('No address found')
      }

      if (!network) {
        throw new Error('No network found')
      }

      const accountAddress = address as Address
      const chainId = getEvmCaip2ChainId(network.chainId)

      const txHash = await request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: [
          {
            from: accountAddress,
            to: contractAddress,
            data: encodedData,
            ...(value && { value })
          }
        ],
        chainId
      })

      // Wait for transaction confirmation in background
      provider
        .waitForTransaction(txHash)
        .then(receipt => {
          if (receipt && receipt.status === 1) {
            onSuccess?.()
          }
        })
        .catch(error => {
          onError?.(error)
        })

      return txHash
    },
    [request, network, address, provider, onSuccess, onError]
  )

  return {
    sendTransaction
  }
}
