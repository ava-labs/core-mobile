import { WalletType } from '@avalabs/avalanche-wallet-sdk'
import { wallet$ } from '@avalabs/wallet-react-components'
import Web3 from 'web3'
import { NetworkID, APIError, ParaSwap, SwapSide } from 'paraswap'
import { OptimalRate } from 'paraswap-core'
import { firstValueFrom } from 'rxjs'
import { getSrcToken, incrementalPromiseResolve, resolve } from 'swap/utils'
import { ChainId } from '@avalabs/chains-sdk'
import { TokenWithBalance } from 'store/balance'

const SERVER_BUSY_ERROR = 'Server too busy'

export async function getSwapRate(request: {
  srcToken?: TokenWithBalance
  destToken?: TokenWithBalance
  amount?: string
  swapSide: SwapSide
}) {
  const { srcToken, destToken, amount, swapSide } = request || []

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

  const [wallet, walletError] = await resolve(firstValueFrom(wallet$))

  if (walletError) {
    return {
      error: walletError
    }
  }

  const optimalRates = paraSwap.getRate(
    getSrcToken(srcToken),
    getSrcToken(destToken),
    amount,
    (wallet as WalletType).getAddressC(),
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
