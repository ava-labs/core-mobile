import { ChainId, Network } from '@avalabs/core-chains-sdk'
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
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction as SentryTransaction } from '@sentry/types'
import { retry } from 'utils/js/retry'

const NETWORK_UNSUPPORTED_ERROR = new Error(
  'Fuji network is not supported by Paraswap'
)

interface BuildTxParams {
  network: string
  srcToken: Address
  destToken: Address
  srcAmount: PriceString
  destAmount: PriceString
  priceRoute: OptimalRate
  userAddress: Address
  partner?: string
  partnerAddress?: string
  partnerFeeBps?: number
  receiver?: Address
  options?: BuildOptions
  srcDecimals?: number
  destDecimals?: number
  permit?: string
  deadline?: string
  sentryTrx?: SentryTransaction
}

interface SwapRate {
  srcToken: string
  srcDecimals: number
  destToken: string
  destDecimals: number
  srcAmount: string
  swapSide: SwapSide
  network: Network
  account: Account
  sentryTrx?: SentryTransaction
}

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

  async getSwapRate({
    srcToken,
    srcDecimals,
    destToken,
    destDecimals,
    srcAmount,
    swapSide,
    network,
    account,
    sentryTrx
  }: SwapRate): Promise<OptimalRate | APIError> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.swap.get_rate')
      .executeAsync(async () => {
        if (network.isTestnet) {
          throw NETWORK_UNSUPPORTED_ERROR
        }
        if (!account) {
          throw new Error('Account address missing')
        }

        const optimalRates = async (): Promise<OptimalRate | APIError> => {
          return await this.paraSwap.getRate(
            srcToken,
            destToken,
            srcAmount,
            account.addressC,
            swapSide,
            {},
            srcDecimals,
            destDecimals
          )
        }

        return await retry({
          operation: optimalRates,
          isSuccess: result =>
            (result as APIError).message !== 'Server too busy'
        })
      })
  }

  async getParaswapSpender(
    sentryTrx?: SentryTransaction
  ): Promise<string | APIError> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.swap.get_paraswap_spender')
      .executeAsync(async () => {
        return this.paraSwap.getTokenTransferProxy()
      })
  }

  async buildTx({
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
    deadline,
    sentryTrx
  }: BuildTxParams): Promise<APIError | Transaction> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.swap.build_trx')
      .executeAsync(async () => {
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
      })
  }
}

export default new SwapService()
