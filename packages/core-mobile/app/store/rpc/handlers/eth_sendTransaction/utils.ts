import { SafeParseReturnType, z } from 'zod'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import BlockaidService from 'services/blockaid/BlockaidService'
import Logger from 'utils/Logger'
import { SignTransactionV2Params } from 'navigation/types'
import { RpcMethod, RpcRequest } from '../../types'
import { EthSendTransactionRpcRequest } from './eth_sendTransaction'

const transactionSchema = z.object({
  from: z.string().length(42),
  to: z.string().length(42),
  data: z.string().optional(),
  value: z.string().startsWith('0x').optional(),
  gas: z.string().startsWith('0x').optional(),
  gasPrice: z.string().startsWith('0x').optional(),
  maxFeePerGas: z.string().startsWith('0x').optional(),
  maxPriorityFeePerGas: z.string().startsWith('0x').optional(),
  nonce: z.string().optional()
})

const paramsSchema = z.tuple([transactionSchema])

const approveDataSchema = z.object({
  txParams: transactionSchema
})

export const parseRequestParams = (
  params: unknown
): SafeParseReturnType<unknown, TransactionParams[]> => {
  return paramsSchema.safeParse(params)
}

export const parseApproveData = (
  data: unknown
): SafeParseReturnType<
  unknown,
  {
    txParams: TransactionParams
  }
> => {
  return approveDataSchema.safeParse(data)
}

export type TransactionParams = {
  from: string
  to: string
  data?: string
  value?: string
  gas?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce?: string
}

export const getChainIdFromRequest = (
  request: RpcRequest<RpcMethod>
): number => {
  if (!request.data.params.chainId) {
    throw new Error('chainId is missing from the request')
  }

  const parts = request.data.params.chainId.split(':')
  if (parts.length < 2 || isNaN(Number(parts[1]))) {
    throw new Error('chainId is not in a valid format')
  }

  return Number(parts[1])
}

export const scanAndSignTransaction = async (
  request: EthSendTransactionRpcRequest,
  transaction: TransactionParams
): Promise<void> => {
  try {
    const chainId = getChainIdFromRequest(request)
    const scanResponse = await BlockaidService.scanTransaction(
      chainId,
      transaction,
      request.peerMeta.url
    )

    if (scanResponse?.validation?.result_type === 'Malicious') {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.MaliciousActivityWarning,
          params: {
            activityType: 'Transaction',
            request,
            onProceed: () => {
              navigateToSignTransaction({ request, transaction, scanResponse })
            }
          }
        }
      })
    } else {
      navigateToSignTransaction({ request, transaction, scanResponse })
    }
  } catch (error) {
    Logger.error('[Blockaid]Failed to validate transaction', error)

    navigateToSignTransaction({ request, transaction })
  }
}

export const navigateToSignTransaction = (
  params: SignTransactionV2Params
): void => {
  Navigation.navigate({
    name: AppNavigation.Root.Wallet,
    params: {
      screen: AppNavigation.Modal.SignTransactionV2,
      params
    }
  })
}
