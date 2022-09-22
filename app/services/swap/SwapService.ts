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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  ): Promise<OptimalRate | APIError> {
    if (network.isTestnet) {
      throw NETWORK_UNSUPPORTED_ERROR
    }
    if (!account) {
      throw new Error('Account address missing')
    }

    const optimalRates = async () => {
      return await this.paraSwap.getRate(
        srcToken,
        destToken,
        srcAmount,
        account.address,
        swapSide,
        {},
        srcDecimals,
        destDecimals
      )
    }

    function checkForErrorsInResult(result: OptimalRate | APIError) {
      return (result as APIError).message === 'Server too busy'
    }

    return await incrementalPromiseResolve<OptimalRate | APIError>(
      () => optimalRates(),
      checkForErrorsInResult
    )
  }

  async getParaswapSpender(): Promise<string | APIError> {
    return this.paraSwap.getTokenTransferProxy()
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
    return await this.paraSwap.buildTx(
      srcToken,
      destToken,
      srcAmount,
      destAmount,
      priceRoute,
      userAddress,
      partner,
      partnerAddress,
      partnerFeeBps,
      receiver,
      options,
      srcDecimals,
      destDecimals,
      permit,
      deadline
    )
  }
}

export default new SwapService()
