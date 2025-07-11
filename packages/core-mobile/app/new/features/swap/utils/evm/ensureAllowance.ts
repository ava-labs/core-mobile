import { resolve } from '@avalabs/core-utils-sdk/dist'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { ERC20__factory } from 'contracts/openzeppelin'
import { swapError } from 'errors/swapError'
import { bigIntToHex } from '@ethereumjs/util'
import { TransactionParams } from '@avalabs/evm-module'
import { RequestContext } from 'store/rpc'

export async function hasEnoughAllowance({
  tokenAddress,
  provider,
  userAddress,
  spenderAddress,
  requiredAmount
}: {
  tokenAddress: string
  provider: JsonRpcBatchInternal
  userAddress: string
  spenderAddress: string
  requiredAmount: bigint
}): Promise<boolean> {
  const contract = ERC20__factory.connect(tokenAddress, provider)

  const [allowance, allowanceError] = await resolve<bigint>(
    contract.allowance(userAddress, spenderAddress)
  )

  if (allowance === null || allowanceError) {
    throw swapError.cannotFetchAllowance(allowanceError)
  }

  return allowance >= BigInt(requiredAmount)
}

export async function buildApprovalTx({
  userAddress,
  spenderAddress,
  tokenAddress,
  amount,
  provider
}: {
  userAddress: string
  spenderAddress: string
  tokenAddress: string
  amount: bigint
  provider: JsonRpcBatchInternal
}): Promise<TransactionParams> {
  const contract = ERC20__factory.connect(tokenAddress, provider)
  const { data } =
    (await contract.approve?.populateTransaction(spenderAddress, amount)) ?? {}

  const approvalTx = {
    from: userAddress,
    to: tokenAddress,
    data
  }

  const [approveGasLimit, approveGasLimitError] = await resolve(
    provider.estimateGas(approvalTx)
  )

  if (approveGasLimitError || !approveGasLimit) {
    throw swapError.approvalTxFailed(approveGasLimitError)
  }

  const gas = bigIntToHex(approveGasLimit)

  return { ...approvalTx, gas }
}

export async function ensureAllowance({
  provider,
  tokenAddress,
  userAddress,
  spenderAddress,
  amount,
  signAndSend
}: {
  provider: JsonRpcBatchInternal
  userAddress: string
  spenderAddress: string
  tokenAddress: string
  amount: bigint
  signAndSend: (
    txParams: [TransactionParams],
    context?: Record<string, unknown>
  ) => Promise<string>
}): Promise<string | undefined> {
  const allowanceCoversAmount = await hasEnoughAllowance({
    tokenAddress,
    provider,
    userAddress,
    spenderAddress,
    requiredAmount: amount
  })

  if (allowanceCoversAmount) {
    return
  }

  const tx = await buildApprovalTx({
    amount,
    provider,
    spenderAddress,
    tokenAddress,
    userAddress
  })

  const [approvalTxHash, approvalTxError] = await resolve(
    signAndSend([tx], {
      // we don't want to show confetti for token spend limit approvals
      [RequestContext.CONFETTI_DISABLED]: true
    })
  )

  if (!approvalTxHash || approvalTxError) {
    throw swapError.approvalTxFailed(approvalTxError)
  }

  return approvalTxHash
}
