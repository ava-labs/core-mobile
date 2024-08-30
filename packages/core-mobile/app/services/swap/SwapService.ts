import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction as SentryTransaction } from '@sentry/types'
import {
  constructFetchFetcher,
  constructGetSpender,
  constructSimpleSDK,
  TransactionParams,
  OptimalRate,
  BuildOptions,
  Address,
  SwapSide,
  PriceString
} from '@paraswap/sdk'
import { ParaSwapVersion } from '@paraswap/core'
import { SimpleFetchSDK } from '@paraswap/sdk/dist/sdk/simple'

export const ETHER_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

const TESTNET_NETWORK_UNSUPPORTED_ERROR = new Error(
  'Testnet network is not supported by Paraswap'
)

interface BuildTxParams {
  network: Network
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

const SUPPORTED_SWAP_NETWORKS = [
  ChainId.AVALANCHE_MAINNET_ID

  // Chains below are supported by Paraswap but not used in the app
  // ChainId.ETHEREUM_HOMESTEAD,
  // ChainId.POLYGON,
  // ChainId.FANTOM,
  // ChainId.BNB,
  // ChainId.ARBITRUM,
  // ChainId.OPTIMISM,
  // ChainId.POLYGON_ZK_EVM,
  // ChainId.BASE
  // POLYGON = 137,
  // FANTOM = 250,
  // BNB = 56,
  // ARBITRUM = 42161,
  // OPTIMISM = 69,
  // POLYGON_ZK_EVM = 1101,
  // BASE = 8453,
]

class SwapService {
  private getParaSwapSDK = (chainId: number): SimpleFetchSDK => {
    return constructSimpleSDK({
      chainId,
      fetch,
      version: ParaSwapVersion.V6
    })
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
  }: SwapRate): Promise<OptimalRate> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.swap.get_rate')
      .executeAsync(async () => {
        if (network.isTestnet) {
          throw TESTNET_NETWORK_UNSUPPORTED_ERROR
        }
        if (!SUPPORTED_SWAP_NETWORKS.includes(network.chainId)) {
          throw new Error(`${network.chainName} is not supported by Paraswap`)
        }
        if (!account) {
          throw new Error('Account address missing')
        }
        return await this.getParaSwapSDK(network.chainId).swap.getRate({
          srcToken,
          destToken,
          amount: srcAmount,
          userAddress: account.addressC,
          side: swapSide,
          srcDecimals,
          destDecimals
        })
      })
  }

  async getParaswapSpender(
    network: Network,
    sentryTrx?: SentryTransaction
  ): Promise<Address> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.swap.get_paraswap_spender')
      .executeAsync(async () => {
        if (network.isTestnet) {
          throw TESTNET_NETWORK_UNSUPPORTED_ERROR
        }
        if (!SUPPORTED_SWAP_NETWORKS.includes(network.chainId)) {
          throw new Error(`${network.chainName} is not supported by Paraswap`)
        }
        const fetcher = constructFetchFetcher(fetch)
        const { getSpender } = constructGetSpender({
          apiURL: this.getParaSwapSDK(network.chainId).apiURL,
          chainId: ChainId.AVALANCHE_MAINNET_ID,
          version: ParaSwapVersion.V6,
          fetcher
        })
        return getSpender()
      })
  }

  async buildTx({
    network,
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
    srcDecimals,
    destDecimals,
    permit,
    deadline,
    sentryTrx
  }: BuildTxParams): Promise<Error | TransactionParams> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.swap.build_trx')
      .executeAsync(async () => {
        if (network.isTestnet) {
          throw TESTNET_NETWORK_UNSUPPORTED_ERROR
        }
        if (!SUPPORTED_SWAP_NETWORKS.includes(network.chainId)) {
          throw new Error(`${network.chainName} is not supported by Paraswap`)
        }
        return await this.getParaSwapSDK(network.chainId).swap.buildTx({
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
          srcDecimals,
          destDecimals,
          permit,
          deadline
        })
      })
  }
}

export default new SwapService()
