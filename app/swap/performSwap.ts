import { GasPrice } from 'utils/GasPriceHook'
import Web3 from 'web3'
import { Allowance } from 'paraswap/build/types'
import { OptimalRate } from 'paraswap-core'
import { incrementalPromiseResolve, resolve } from 'swap/utils'
import { BN } from 'avalanche'
import { NetworkID, APIError, ParaSwap } from 'paraswap'
import { ChainId } from '@avalabs/chains-sdk'
import ERC20_ABI from '../contracts/erc20.abi.json'

const SERVER_BUSY_ERROR = 'Server too busy'

export async function performSwap(
  request: {
    srcAmount?: string
    destAmount?: string
    priceRoute?: OptimalRate
    gasLimit?: any
    gasPrice?: GasPrice
  },
  userAddress: string,
  sendCustomTx: (
    gasPrice: BN,
    gasLimit: number,
    data?: string | undefined,
    to?: string | undefined,
    value?: string | undefined,
    nonce?: number | undefined
  ) => Promise<string>
) {
  log('~~~~~~~~~ perform swap')
  const { srcAmount, destAmount, priceRoute, gasLimit, gasPrice } = request
  log('~~~~~~~~~ srcAmount', srcAmount)
  log('~~~~~~~~~ destAmount', destAmount)
  log('~~~~~~~~~ priceRoute', priceRoute)
  log('~~~~~~~~~ gasLimit', gasLimit)
  log('~~~~~~~~~ gasPrice', gasPrice)

  if (!priceRoute) {
    return {
      error: 'request requires the paraswap priceRoute'
    }
  }

  if (!userAddress) {
    return {
      error: 'no userAddress on request'
    }
  }

  if (!srcAmount) {
    return {
      error: 'no amount on request'
    }
  }

  if (!destAmount) {
    return {
      error: 'no amount on request'
    }
  }

  if (!gasLimit) {
    return {
      error: 'request requires gas limit from paraswap response'
    }
  }

  // only Mainnet has swap UI enabled and can perform swap
  const chainId = Number(ChainId.AVALANCHE_MAINNET_ID)
  const pSwap = new ParaSwap(chainId as NetworkID, undefined, new Web3())

  const buildOptions = undefined,
    partnerAddress = undefined,
    partner = 'Avalanche',
    receiver = undefined,
    permit = undefined,
    deadline = undefined,
    partnerFeeBps = undefined

  log('~~~~~~~~~ userAddress', userAddress)
  log('~~~~~~~~~ partner', partner)
  const spender = await pSwap.getTokenTransferProxy()
  log('~~~~~~~~~ spender', spender)

  let approveTxHash

  // no need to approve AVAX
  if (priceRoute.srcToken !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
    const contract = new (pSwap.web3Provider as Web3).eth.Contract(
      ERC20_ABI as any,
      priceRoute.srcToken
    )
    log('~~~~~~~~~ contract', contract)

    const [allowance, allowanceError] = await resolve(
      pSwap.getAllowance(userAddress, priceRoute.srcToken)
    )
    log('~~~~~~~~~allowance', allowance)
    log('~~~~~~~~~allowanceError', allowanceError)
    if (
      allowanceError ||
      (!!(allowance as APIError).message &&
        (allowance as APIError).message !== 'Not Found')
    ) {
      return {
        error: `Allowance Error: ${
          allowanceError ?? (allowance as APIError).message
        }`
      }
    }

    const [approveHash, approveError] = await resolve(
      /**
       * We may need to check if the allowance is enough to cover what is trying to be sent?
       */
      (allowance as Allowance).tokenAddress
        ? (Promise.resolve([]) as any)
        : sendCustomTx(
            (gasPrice as GasPrice).bn,
            Number(gasLimit),
            contract.methods.approve(spender, srcAmount).encodeABI(),
            priceRoute.srcToken
          )
    )
    log('~~~~~~~~~approveTxHash', approveHash)
    log('~~~~~~~~~approveError', approveError)

    if (approveError) {
      return {
        error: `Approve Error: ${approveError}`
      }
    }

    approveTxHash = approveHash
  }

  const txData = pSwap.buildTx(
    priceRoute.srcToken,
    priceRoute.destToken,
    srcAmount,
    destAmount,
    priceRoute,
    userAddress,
    partner,
    partnerAddress,
    partnerFeeBps,
    receiver,
    buildOptions,
    priceRoute.srcDecimals,
    priceRoute.destDecimals,
    permit,
    deadline
  )
  log('~~~~~~~~~txData', txData)

  function checkForErrorsInResult(result: OptimalRate | APIError) {
    return (result as APIError).message === SERVER_BUSY_ERROR
  }

  const [txBuildData, txBuildDataError] = await resolve(
    incrementalPromiseResolve(() => txData, checkForErrorsInResult)
  )
  log('~~~~~~~~~txBuildData', txBuildData)
  log('~~~~~~~~~txBuildDataError', txBuildDataError)

  if ((txBuildData as APIError).message) {
    return {
      error: (txBuildData as APIError).message
    }
  }
  if (txBuildDataError) {
    return {
      error: `Data Error: ${txBuildDataError}`
    }
  }

  const [swapTxHash, txError] = await resolve(
    sendCustomTx(
      (gasPrice as GasPrice).bn,
      Number(txBuildData.gas),
      txBuildData.data,
      txBuildData.to,
      priceRoute.srcToken === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
        ? `0x${new BN(srcAmount).toString('hex')}`
        : undefined // AVAX value needs to be sent with the transaction
    )
  )
  log('~~~~~~~~~swapTxHash', swapTxHash)
  log('~~~~~~~~~txError', txError)

  if (txError) {
    const shortError = txError.message.split('\n')[0]
    return {
      error: shortError
    }
  }

  return {
    result: {
      swapTxHash,
      approveTxHash
    }
  }
}

function log(message?: any, ...optionalParams: any[]) {
  if (__DEV__) {
    console.log(message, ...optionalParams)
  }
}
