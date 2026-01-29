import { z } from 'zod'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
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
import { EVM_NATIVE_TOKEN_ADDRESS } from '../consts'

const txResponseSchema = z
  .object({
    to: z.string(),
    from: z.string(),
    value: z.string(),
    data: z.string(),
    chainId: z.number(),
    gas: z.string().optional(),
    gasPrice: z.string().optional()
  })
  .passthrough() // allows unknown fields

const TESTNET_NETWORK_UNSUPPORTED_ERROR = new Error(
  'Testnet network is not supported by Paraswap'
)

export interface BuildTxParams {
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
  isDirectFeeTransfer?: boolean
  receiver?: Address
  options?: BuildOptions
  srcDecimals?: number
  destDecimals?: number
  permit?: string
  deadline?: string
}

interface SwapRate {
  srcToken: string
  srcDecimals: number
  destToken: string
  destDecimals: number
  srcAmount: string
  swapSide: SwapSide
  network: Network
  address: string
  abortSignal?: AbortSignal
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

class ParaswapService {
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
    address,
    abortSignal
  }: SwapRate): Promise<OptimalRate> {
    return SentryWrapper.startSpan(
      {
        name: 'swap',
        contextName: 'svc.swap.get_rate'
      },
      async () => {
        if (network.isTestnet) {
          throw TESTNET_NETWORK_UNSUPPORTED_ERROR
        }

        if (!SUPPORTED_SWAP_NETWORKS.includes(network.chainId)) {
          throw new Error(`${network.chainName} is not supported by Paraswap`)
        }

        if (!address) {
          throw new Error('Account address missing')
        }

        const isFromTokenNative = network.networkToken.symbol === srcToken
        const isDestTokenNative = network.networkToken.symbol === destToken

        return await this.getParaSwapSDK(network.chainId).swap.getRate(
          {
            srcToken: isFromTokenNative ? EVM_NATIVE_TOKEN_ADDRESS : srcToken,
            destToken: isDestTokenNative ? EVM_NATIVE_TOKEN_ADDRESS : destToken,
            amount: srcAmount,
            userAddress: address,
            side: swapSide,
            srcDecimals,
            destDecimals
          },
          abortSignal
        )
      }
    )
  }

  async getParaswapSpender(network: Network): Promise<Address> {
    return SentryWrapper.startSpan(
      { name: 'swap', contextName: 'svc.swap.get_paraswap_spender' },
      async () => {
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
      }
    )
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
    isDirectFeeTransfer,
    receiver,
    srcDecimals,
    destDecimals,
    permit,
    deadline
  }: BuildTxParams): Promise<TransactionParams> {
    return SentryWrapper.startSpan(
      { name: 'swap', contextName: 'svc.swap.build_trx' },
      async () => {
        if (network.isTestnet) {
          throw TESTNET_NETWORK_UNSUPPORTED_ERROR
        }
        if (!SUPPORTED_SWAP_NETWORKS.includes(network.chainId)) {
          throw new Error(`${network.chainName} is not supported by Paraswap`)
        }

        const response = await this.getParaSwapSDK(
          network.chainId
        ).swap.buildTx({
          srcToken,
          destToken,
          srcAmount,
          destAmount,
          priceRoute,
          userAddress,
          partner,
          partnerAddress,
          partnerFeeBps,
          isDirectFeeTransfer,
          receiver,
          srcDecimals,
          destDecimals,
          permit,
          deadline
        })

        const result = txResponseSchema.safeParse(response)

        if (!result.success) {
          throw new Error('Unexpected response from our pricing provider')
        }

        return result.data
      }
    )
  }
}

export default new ParaswapService()
