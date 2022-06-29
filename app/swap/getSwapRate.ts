import Web3 from 'web3'
import { APIError, NetworkID, ParaSwap, SwapSide } from 'paraswap'
import { OptimalRate } from 'paraswap-core'
import { getSrcToken, incrementalPromiseResolve } from 'swap/utils'
import { ChainId } from '@avalabs/chains-sdk'
import { TokenWithBalance } from 'store/balance'
import { Account } from 'store/account'

const SERVER_BUSY_ERROR = 'Server too busy'

export async function getSwapRate(request: {
  srcToken?: TokenWithBalance
  destToken?: TokenWithBalance
  amount?: string
  swapSide: SwapSide
  account: Account
}) {
  const { srcToken, destToken, amount, swapSide, account } = request || []

  if (!srcToken) {
    return {
      error: 'no source token on request'
    }
  }

  if (!destToken) {
    return {
      error: 'no destination token on request'
    }
  }

  if (!amount) {
    return {
      error: 'no amount on request'
    }
  }

  // only Mainnet has swap UI enabled and can perform swap
  const chainId = Number(ChainId.AVALANCHE_MAINNET_ID)
  const paraSwap = new ParaSwap(chainId as NetworkID, undefined, new Web3())

  const optimalRates = paraSwap.getRate(
    getSrcToken(srcToken),
    getSrcToken(destToken),
    amount,
    account.address,
    swapSide,
    {
      partner: 'Avalanche'
    },
    srcToken.decimals,
    destToken.decimals
  )

  function checkForErrorsInResult(result: OptimalRate | APIError) {
    return (result as APIError).message === SERVER_BUSY_ERROR
  }

  const result: OptimalRate | APIError = await incrementalPromiseResolve(
    () => optimalRates,
    checkForErrorsInResult
  )
  console.log('----------result', result)

  if ((result as APIError).message) {
    return {
      error: (result as APIError).message
    }
  }

  return {
    result: result as OptimalRate
  }
}
