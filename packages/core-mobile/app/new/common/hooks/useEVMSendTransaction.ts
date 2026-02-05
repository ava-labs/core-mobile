import { useCallback, useEffect, useRef } from 'react'
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
  onSettled?: () => void // Called when transaction completes (success or failure)
}

type EVMSendTransactionParams = {
  contractAddress: Address
  encodedData: Hex
  value?: Hex // Optional value for native token transfers (e.g., AVAX)
}

/**
 * Generic hook for sending EVM transactions with fire-and-forget confirmation handling.
 *
 * The transaction is submitted immediately and the txHash is returned.
 * Transaction confirmation is awaited in the background, and callbacks are invoked
 * only if the component is still mounted when confirmation arrives.
 */
export const useEVMSendTransaction = ({
  network,
  provider,
  onSuccess,
  onError,
  onSettled
}: UseEVMSendTransactionProps): {
  sendTransaction: (params: EVMSendTransactionParams) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  // Track mounted state to prevent callbacks after unmount
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const sendTransaction = useCallback(
    async ({
      contractAddress,
      encodedData,
      value
    }: // eslint-disable-next-line sonarjs/cognitive-complexity
    EVMSendTransactionParams) => {
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

      // Wait for transaction confirmation in background (fire-and-forget)
      // Callbacks are only invoked if the component is still mounted
      provider
        .waitForTransaction(txHash)
        .then(receipt => {
          if (!isMountedRef.current) return

          if (receipt && receipt.status === 1) {
            onSuccess?.()
          } else if (receipt && receipt.status === 0) {
            onError?.(new Error('Transaction reverted'))
          } else {
            onError?.(new Error('Transaction failed'))
          }
        })
        .catch(error => {
          if (!isMountedRef.current) return
          onError?.(error)
        })
        .finally(() => {
          if (!isMountedRef.current) return
          onSettled?.()
        })

      return txHash
    },
    [request, network, address, provider, onSuccess, onError, onSettled]
  )

  return {
    sendTransaction
  }
}
