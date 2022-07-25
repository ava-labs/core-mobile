import { APIError } from 'paraswap'
import { incrementalPromiseResolve, resolve } from 'swap/utils'
import { BN } from 'avalanche'
import { ChainId, Network } from '@avalabs/chains-sdk'
import walletService from 'services/wallet/WalletService'
import { Account } from 'store/account'
import networkFeeService from 'services/networkFee/NetworkFeeService'
import swapService from 'services/swap/SwapService'
import Big from 'big.js'
import networkService from 'services/network/NetworkService'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { BigNumber, ethers } from 'ethers'
import { OptimalRate } from 'paraswap-core'
import { isAPIError } from 'utils/Utils'
import Logger from 'utils/Logger'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'

const SERVER_BUSY_ERROR = 'Server too busy'

function checkForErrorsInResult(result: OptimalRate | APIError) {
  return (result as APIError).message === SERVER_BUSY_ERROR
}

export async function performSwap(request: {
  srcToken: string
  destToken: string
  srcDecimals: number
  destDecimals: number
  srcAmount: string
  optimalRate: OptimalRate
  destAmount: any
  gasLimit: number
  gasPrice: BigNumber
  slippage: number
  network?: Network
  account?: Account
}) {
  const {
    srcToken,
    destToken,
    srcDecimals,
    destDecimals,
    srcAmount,
    optimalRate,
    destAmount,
    gasLimit,
    gasPrice,
    slippage,
    network,
    account
  } = request

  if (!optimalRate) {
    return Promise.reject({
      error: 'request requires the paraswap priceRoute'
    })
  }

  if (!srcAmount) {
    return Promise.reject({
      error: 'no amount on request'
    })
  }

  if (!destAmount) {
    return Promise.reject({
      error: 'no amount on request'
    })
  }

  if (!gasLimit) {
    return Promise.reject({
      error: 'request requires gas limit from paraswap response'
    })
  }

  if (!network || network.isTestnet) {
    return Promise.reject({
      error: `Network Init Error: Wrong network`
    })
  }

  if (!account || !account.address) {
    return Promise.reject({
      error: `Wallet Error: address not defined`
    })
  }

  const srcTokenAddress = optimalRate.srcToken
  // srcToken === network.networkToken.symbol ? ETHER_ADDRESS : srcToken
  const destTokenAddress = optimalRate.destToken
  // destToken === network.networkToken.symbol ? ETHER_ADDRESS : destToken
  const defaultGasPrice = await networkFeeService.getNetworkFee(network)

  const buildOptions = undefined,
    partnerAddress = undefined,
    partner = 'Avalanche',
    userAddress = account.address,
    receiver = undefined,
    permit = undefined,
    deadline = undefined,
    partnerFeeBps = undefined

  const spender = await swapService.getParaswapSpender()

  let approveTxHash

  const minAmount = new Big(optimalRate.destAmount)
    .times(1 - slippage / 100)
    .toFixed(0)

  const maxAmount = new Big(srcAmount).times(1 + slippage / 100).toFixed(0)

  const sourceAmount = optimalRate.side === 'SELL' ? srcAmount : maxAmount

  const destinationAmount =
    optimalRate.side === 'SELL' ? minAmount : optimalRate.destAmount

  const avalancheProvider = (await networkService.getAvalancheProvider(
    network.isTestnet
  )) as JsonRpcBatchInternal

  // no need to approve AVAX
  if (srcToken !== network.networkToken.symbol) {
    const contract = new ethers.Contract(
      srcTokenAddress,
      ERC20.abi,
      avalancheProvider
    )

    const [allowance, allowanceError] = await resolve(
      contract.allowance(userAddress, srcTokenAddress)
    )

    if (allowanceError) {
      Logger.error('allowance error', allowanceError)
      return Promise.reject({
        error: `Allowance Error: ${
          allowanceError ?? (allowance as APIError).message
        }`
      })
    }

    if ((allowance as BigNumber).lt(sourceAmount)) {
      const [approveGasLimit] = await resolve(
        contract.estimateGas.approve(spender, sourceAmount)
      )

      if (!(allowance as BigNumber).gt(sourceAmount)) {
        const { data } = await contract.populateTransaction.approve!(
          spender,
          sourceAmount
        )
        const [signedTx, signError] = await resolve(
          walletService.sign(
            {
              nonce: await avalancheProvider.getTransactionCount(userAddress),
              chainId: ChainId.AVALANCHE_MAINNET_ID,
              gasPrice: defaultGasPrice?.low,
              gasLimit: approveGasLimit ? approveGasLimit.toNumber() : gasLimit,
              data,
              to: srcTokenAddress
            },
            account.index,
            network
          )
        )

        if (signError || isAPIError(signedTx)) {
          Logger.error('approve sign error', signError)
          return Promise.reject({
            error: `Approve Error: ${signError}`
          })
        }

        const [hash, approveError] = await resolve(
          networkService.sendTransaction(signedTx, network)
        )

        if (approveError) {
          Logger.error('approve send error', approveError)
          return Promise.reject({
            error: `Approve error ${approveError}`
          })
        }

        approveTxHash = hash
      } else {
        approveTxHash = []
      }
    }
  }

  const txData = swapService.buildTx(
    ChainId.AVALANCHE_MAINNET_ID.toString(),
    srcTokenAddress,
    destTokenAddress,
    sourceAmount,
    destinationAmount,
    optimalRate,
    userAddress,
    partner,
    partnerAddress,
    partnerFeeBps,
    receiver,
    buildOptions,
    network.networkToken.symbol === srcToken
      ? network.networkToken.decimals
      : srcDecimals,
    network.networkToken.symbol === destToken
      ? network.networkToken.decimals
      : destDecimals,
    permit,
    deadline
  )

  const [txBuildData, txBuildDataError] = await resolve(
    incrementalPromiseResolve(() => txData, checkForErrorsInResult)
  )

  if ((txBuildData as APIError).message) {
    Logger.error('error building API', (txBuildData as APIError).message)
    return Promise.reject({
      error: (txBuildData as APIError).message
    })
  }
  if (txBuildDataError) {
    Logger.error('error building', txBuildDataError)
    return Promise.reject({
      error: `Data Error: ${txBuildDataError}`
    })
  }

  // this sometimes is returning 1 below the current count
  // asked about manually increasing it, and it's fine, except
  // user tries to do 2 simultaneous tx in different wallets
  const nonce = await avalancheProvider.getTransactionCount(userAddress)

  const [signedTx, signError] = await resolve(
    walletService.sign(
      {
        nonce: nonce + 1,
        chainId: ChainId.AVALANCHE_MAINNET_ID,
        gasPrice: BigNumber.from(gasPrice ? gasPrice : defaultGasPrice?.low),
        gasLimit: Number(txBuildData.gas),
        data: txBuildData.data,
        to: txBuildData.to,
        value:
          srcToken === network.networkToken.symbol
            ? `0x${new BN(sourceAmount).toString('hex')}`
            : undefined // AVAX value needs to be sent with the transaction
      },
      account.index,
      network
    )
  )

  if (signError) {
    Logger.error('error signing', signError)
    return Promise.reject({
      error: `Tx Error: ${signError}`
    })
  }

  const [swapTxHash, txError] = await resolve(
    networkService.sendTransaction(signedTx, network)
  )

  if (txError) {
    const shortError = txError.message.split('\n')[0]
    Logger.error('error sending', txError)
    return Promise.reject({
      error: shortError
    })
  }

  return {
    result: {
      swapTxHash,
      approveTxHash
    }
  }
}
