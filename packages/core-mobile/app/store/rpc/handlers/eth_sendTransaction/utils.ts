import { SafeParseReturnType, z } from 'zod'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import BlockaidService from 'services/blockaid/BlockaidService'
import { TransactionValidationResult } from 'services/blockaid/types'
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

export const validateAndSignTransaction = async (
  request: EthSendTransactionRpcRequest,
  txParam: TransactionParams,
  isValidationDisabled: boolean
): Promise<void> => {
  if (isValidationDisabled) {
    navigateToSignTransaction(request, txParam)
    return
  }

  try {
    const chainId = getChainIdFromRequest(request)
    const validationResult = await BlockaidService.validateTransaction(
      chainId,
      txParam,
      request.peerMeta.url
    )

    navigateToSignTransaction(request, txParam, validationResult)
  } catch (error) {
    navigateToSignTransaction(request, txParam)
  }
}

const navigateToSignTransaction = (
  request: EthSendTransactionRpcRequest,
  txParam: TransactionParams,
  validationResult?: TransactionValidationResult
): void => {
  Navigation.navigate({
    name: AppNavigation.Root.Wallet,
    params: {
      screen: AppNavigation.Modal.SignTransactionV2,
      params: {
        request,
        transaction: txParam,
        validationResult
      }
    }
  })
}
