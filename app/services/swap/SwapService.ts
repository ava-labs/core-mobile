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
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction as SentryTransaction } from '@sentry/types'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'

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
    account: Account,
    sentryTrx?: SentryTransaction
  ): Promise<OptimalRate | APIError> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.swap.get_rate')
      .executeAsync(async () => {
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

        return await exponentialBackoff(
          optimalRates,
          result => (result as APIError).message !== 'Server too busy'
        )
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
    deadline?: string,
    sentryTrx?: SentryTransaction
  ): Promise<APIError | Transaction> {
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
