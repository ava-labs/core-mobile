import assert from 'assert'
import { Contract } from 'ethers'
import { Network } from '@avalabs/chains-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import Big from 'big.js'
import { BN } from 'bn.js'
import { APIError, ETHER_ADDRESS, Transaction } from 'paraswap'
import { OptimalRate } from 'paraswap-core'
import { promiseResolveWithBackoff, resolve } from '@avalabs/utils-sdk'
import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import { buildTx, getParaswapSpender } from './paraswapUtils'

export type PerformSwapParams = {
  srcTokenAddress: string | undefined
  isSrcTokenNative: boolean
  destTokenAddress: string | undefined
  isDestTokenNative: boolean
  priceRoute: OptimalRate | undefined
  slippage: number
  activeNetwork: Network | undefined
  provider: JsonRpcBatchInternal
  userAddress: string | undefined
  signAndSend: (txParams: [TransactionParams]) => Promise<string>
}

const bigIntToHex = (n: bigint | undefined): string =>
  `0x${BigInt(n ?? 0).toString(16)}`

// copied from https://github.com/ava-labs/avalanche-sdks/tree/alpha-release/packages/paraswap-sdk
// modified to use our new in app request for now
// TODO: move this back to the sdk once everything is stable

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function performSwap({
  srcTokenAddress,
  isSrcTokenNative,
  destTokenAddress,
  isDestTokenNative,
  priceRoute,
  slippage,
  activeNetwork,
  provider,
  userAddress,
  signAndSend
}: PerformSwapParams): Promise<{
  swapTxHash: string
  approveTxHash: string | undefined
}> {
  assert(srcTokenAddress, 'no source token on request')
  assert(destTokenAddress, 'no destination token on request')
  assert(priceRoute, 'request requires the paraswap priceRoute')
  assert(userAddress, 'Wallet Error: address not defined')
  assert(activeNetwork, 'Network Init Error: Wrong network')
  assert(!activeNetwork.isTestnet, 'Network Init Error: Wrong network')

  const spenderAddress = await getParaswapSpender()

  const sourceTokenAddress = isSrcTokenNative ? ETHER_ADDRESS : srcTokenAddress
  const destinationTokenAddress = isDestTokenNative
    ? ETHER_ADDRESS
    : destTokenAddress

  const buildOptions = undefined,
    partnerAddress = undefined,
    partner = 'Avalanche',
    receiver = undefined,
    permit = undefined,
    deadline = undefined,
    partnerFeeBps = undefined

  let approveTxHash: string | undefined

  const minAmount = new Big(priceRoute.destAmount)
    .times(1 - slippage / 100)
    .toFixed(0)

  const maxAmount = new Big(priceRoute.srcAmount)
    .times(1 + slippage / 100)
    .toFixed(0)

  const sourceAmount =
    priceRoute.side === 'SELL' ? priceRoute.srcAmount : maxAmount

  const destinationAmount =
    priceRoute.side === 'SELL' ? minAmount : priceRoute.destAmount

  // no need to approve native token
  if (!isSrcTokenNative) {
    const contract = new Contract(sourceTokenAddress, ERC20.abi, provider)

    const [allowance, allowanceError] = await resolve<bigint>(
      contract.allowance?.(userAddress, spenderAddress) ?? Promise.resolve(null)
    )

    if (allowanceError || allowance === null) {
      throw new Error(`Allowance Error: ${allowanceError}`)
    }

    if (allowance < BigInt(sourceAmount)) {
      const [approveGasLimit] = await resolve(
        contract.approve?.estimateGas(spenderAddress, sourceAmount) ??
          Promise.resolve(null)
      )

      const { data } =
        (await contract.approve?.populateTransaction(
          spenderAddress,
          sourceAmount
        )) ?? {}

      const gas = bigIntToHex(
        approveGasLimit
          ? approveGasLimit
          : BigInt(Number(priceRoute.gasCost ?? 0))
      )
      const txParams: [TransactionParams] = [
        {
          from: userAddress,
          to: sourceTokenAddress,
          gas,
          data
        }
      ]

      const [hash, approveError] = await resolve(signAndSend(txParams))

      if (approveError) {
        throw new Error(`Approve Error: ${approveError}`)
      }

      assert(hash, 'Tx hash empty')
      approveTxHash = hash
    } else {
      approveTxHash = undefined
    }
  }

  function checkForErrorsInResult(result: Transaction | APIError): boolean {
    return (
      (result as APIError).message === 'Server too busy' ||
      // paraswap returns responses like this: {error: 'Not enough 0x4f60a160d8c2dddaafe16fcc57566db84d674…}
      // when they are too slow to detect the approval
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any).error
    )
  }

  const [txBuildData, txBuildDataError] = await resolve(
    promiseResolveWithBackoff(
      () =>
        buildTx({
          network: activeNetwork.chainId.toString(),
          srcToken: sourceTokenAddress,
          destToken: destinationTokenAddress,
          srcAmount: sourceAmount,
          destAmount: destinationAmount,
          priceRoute,
          userAddress,
          partner,
          partnerAddress,
          partnerFeeBps,
          receiver,
          options: buildOptions,
          srcDecimals: priceRoute.srcDecimals,
          destDecimals: priceRoute.destDecimals,
          permit,
          deadline
        }),
      checkForErrorsInResult,
      0,
      10
    )
  )

  if (!txBuildData || txBuildDataError || 'message' in txBuildData) {
    throw new Error(`Data Error: ${txBuildDataError}`)
  }

  const txParams: [TransactionParams] = [
    {
      from: userAddress,
      to: txBuildData.to,
      // @ts-ignore
      gas: bigIntToHex(txBuildData.gas), //gas property is not defined in Transaction@paraswap type but api does return this prop
      data: txBuildData.data,
      value: isSrcTokenNative
        ? `0x${new BN(sourceAmount).toString('hex')}`
        : undefined // AVAX value needs to be sent with the transaction
    }
  ]

  const [swapTxHash, txError] = await resolve(signAndSend(txParams))

  if (txError) {
    throw new Error(`Tx Error: ${txError}`)
  }

  assert(swapTxHash, 'Tx hash empty')

  return {
    swapTxHash,
    approveTxHash
  }
}
