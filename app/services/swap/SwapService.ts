import { ChainId, Network } from '@avalabs/chains-sdk'
import {
  Address,
  APIError,
  BuildOptions,
  ParaSwap,
  PriceString,
  SwapSide,
  Transaction
} from 'paraswap'
import { OptimalRate } from 'paraswap-core'
import Web3 from 'web3'
import { Account } from 'store/account'
import { incrementalPromiseResolve } from 'swap/utils'

const NETWORK_UNSUPPORTED_ERROR = new Error(
  'Fuji network is not supported by Paraswap'
)

class SwapService {
  private paraSwap = new ParaSwap(
    ChainId.AVALANCHE_MAINNET_ID,
    undefined,
    new Web3()
  )

  public get apiUrl(): string {
    return (this.paraSwap as any).apiURL
  }

  async getSwapRate(
    srcToken: string,
    srcDecimals: number,
    destToken: string,
    destDecimals: number,
    srcAmount: string,
    swapSide: SwapSide,
    network: Network,
    account: Account
  ) {
    if (network.isTestnet) {
      throw NETWORK_UNSUPPORTED_ERROR
    }
    if (!account) {
      throw new Error('Account address missing')
    }

    const query = new URLSearchParams({
      srcToken,
      destToken,
      amount: srcAmount,
      side: swapSide || SwapSide.SELL,
      network: ChainId.AVALANCHE_MAINNET_ID.toString(),
      srcDecimals: `${
        network?.networkToken.symbol === srcToken ? 18 : srcDecimals
      }`,
      destDecimals: `${
        network?.networkToken.symbol === destToken ? 18 : destDecimals
      }`,
      userAddress: account.address
    })

    // apiURL is a private property
    const url = `${this.apiUrl}/prices/?${query.toString()}`

    const optimalRates = async () => {
      const response = await fetch(url)
      const data = await response.json()
      return data.priceRoute
    }

    function checkForErrorsInResult(result: OptimalRate | APIError) {
      return (result as APIError).message === 'Server too busy'
    }

    const result = await incrementalPromiseResolve<OptimalRate | APIError>(
      () => optimalRates(),
      checkForErrorsInResult
    )

    return result
  }

  async getParaswapSpender(): Promise<string> {
    const response = await fetch(
      `${this.apiUrl}/adapters/contracts?network=${ChainId.AVALANCHE_MAINNET_ID}`
    )

    const result = await response.json()
    return result.TokenTransferProxy
  }

  async buildTx(
    network: string,
    srcToken: Address,
    destToken: Address,
    srcAmount: PriceString,
    destAmount: PriceString,
    priceRoute: OptimalRate,
    userAddress: Address,
    partner?: string,
    partnerAddress?: string,
    partnerFeeBps?: number,
    receiver?: Address,
    options?: BuildOptions,
    srcDecimals?: number,
    destDecimals?: number,
    permit?: string,
    deadline?: string
  ): Promise<APIError | Transaction> {
    const query = new URLSearchParams(options as Record<string, string>)
    const txURL = `${this.apiUrl}/transactions/${network}/?${query.toString()}`
    const txConfig = {
      priceRoute,
      srcToken,
      destToken,
      srcAmount,
      destAmount,
      userAddress,
      partner,
      partnerAddress,
      partnerFeeBps,
      receiver,
      srcDecimals,
      destDecimals,
      permit,
      deadline
    }

    const response = await fetch(txURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(txConfig)
    })
    return await response.json()
  }
}

export default new SwapService()
