import { useCallback, useEffect, useRef } from 'react'
import { Address, Hex } from 'viem'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from '@avalabs/vm-module-types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { RequestContext } from 'store/rpc/types'

type UseETHSendTransactionProps = {
  network: Network | undefined
  provider: JsonRpcBatchInternal | undefined
  onConfirmed?: (requestId?: string) => void // Called when transaction is confirmed (status === 1)
  onReverted?: (requestId?: string) => void // Called when transaction is reverted (status === 0)
  onError?: (error: unknown, requestId?: string) => void
  onSettled?: (requestId?: string) => void // Called when transaction completes (success or failure)
}

type ETHSendTransactionParams = {
  contractAddress: Address
  encodedData: Hex
  value?: Hex // Optional value for native token transfers (e.g., AVAX)
  requestId?: string // Optional identifier to track which request completed in callbacks
  confettiDisabled?: boolean // Disable confetti animation on transaction success
}

/**
 * Generic hook for sending EVM transactions with fire-and-forget confirmation handling.
 *
 * The transaction is submitted immediately and the txHash is returned.
 * Transaction confirmation is awaited in the background, and callbacks are invoked
 * only if the component is still mounted when confirmation arrives.
 */
export const useETHSendTransaction = ({
  network,
  provider,
  onConfirmed,
  onReverted,
  onError,
  onSettled
}: UseETHSendTransactionProps): {
  sendTransaction: (params: ETHSendTransactionParams) => Promise<string>
} => {
  const { request } = useInAppRequest()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC

  // Store callbacks in refs to ensure they're called even after unmount
  // This is important because transaction confirmation may arrive after the modal is dismissed
  const onConfirmedRef = useRef(onConfirmed)
  const onRevertedRef = useRef(onReverted)
  const onErrorRef = useRef(onError)
  const onSettledRef = useRef(onSettled)

  useEffect(() => {
    onConfirmedRef.current = onConfirmed
    onRevertedRef.current = onReverted
    onErrorRef.current = onError
    onSettledRef.current = onSettled
  }, [onConfirmed, onReverted, onError, onSettled])

  const sendTransaction = useCallback(
    async ({
      contractAddress,
      encodedData,
      value,
      requestId,
      confettiDisabled
    }: ETHSendTransactionParams) => {
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

      let txHash: string
      try {
        txHash = await request({
          method: RpcMethod.ETH_SEND_TRANSACTION,
          params: [
            {
              from: accountAddress,
              to: contractAddress,
              data: encodedData,
              ...(value && { value })
            }
          ],
          chainId,
          ...(confettiDisabled && {
            context: { [RequestContext.CONFETTI_DISABLED]: true }
          })
        })
      } catch (error) {
        onErrorRef.current?.(error, requestId)
        onSettledRef.current?.(requestId)
        throw error // Re-throw to maintain existing flow for callers
      }

      // Wait for transaction confirmation in background (fire-and-forget)
      // Use refs to ensure callbacks are called even after component unmount
      provider
        .waitForTransaction(txHash)
        .then(receipt => {
          if (receipt && receipt.status === 1) {
            onConfirmedRef.current?.(requestId)
          } else if (receipt && receipt.status === 0) {
            onRevertedRef.current?.(requestId)
          } else {
            onErrorRef.current?.(new Error('Transaction failed'), requestId)
          }
        })
        .catch(error => {
          onErrorRef.current?.(error, requestId)
        })
        .finally(() => {
          onSettledRef.current?.(requestId)
        })

      return txHash
    },
    [request, network, address, provider]
  )

  return {
    sendTransaction
  }
}
