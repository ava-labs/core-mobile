import {
  Erc1155Token,
  Erc721Token,
  Glacier,
  ListAddressChainsResponse,
  ListValidatorDetailsResponse,
  ListCChainAtomicTransactionsResponse,
  BlockchainId,
  Network,
  SortOrder
} from '@avalabs/glacier-sdk'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { CORE_HEADERS } from 'utils/api/constants'
import { GlacierFetchHttpRequest } from './GlacierFetchHttpRequest'

/**
 * Parameter shape of the underlying Glacier SDK's `listValidators`. Pulled
 * out as a named type so callers don't have to `Parameters<typeof ...>` it
 * everywhere and so the surface stays decoupled from the SDK's namespacing.
 */
export type ListPrimaryNetworkValidatorsParams = Parameters<
  Glacier['primaryNetwork']['listValidators']
>[0]

if (!Config.GLACIER_URL)
  Logger.warn(
    'GLACIER_URL ENV is missing in env file. Glacier service disabled.'
  )

export const GLACIER_URL = Config.GLACIER_URL

class GlacierService {
  private glacierSdk = new Glacier(
    {
      BASE: Config.GLACIER_URL,
      HEADERS: CORE_HEADERS
    },
    GlacierFetchHttpRequest
  )
  private isGlacierHealthy = true
  private supportedChainIds: string[] = []

  async isNetworkSupported(chainId: number): Promise<boolean> {
    if (!this.isGlacierHealthy) return this.isGlacierHealthy
    const chainIds = await this.getSupportedChainIds()
    return chainIds.some(id => id === chainId.toString())
  }

  setGlacierToUnhealthy(): void {
    this.isGlacierHealthy = false
    setTimeout(() => {
      this.isGlacierHealthy = true
    }, 5 * 60 * 1000) // 5 minutes
  }

  private async getSupportedChainIds(): Promise<string[]> {
    if (this.supportedChainIds.length) {
      return this.supportedChainIds
    }

    try {
      const supportedChains = await this.glacierSdk.evmChains.supportedChains(
        {}
      )
      return supportedChains.chains.map(chain => chain.chainId)
    } catch {
      return []
    }
  }

  async reindexNft({
    address,
    chainId,
    tokenId
  }: {
    address: string
    chainId: string
    tokenId: string
  }): Promise<void> {
    await this.glacierSdk.nfTs.reindexNft({
      address,
      chainId,
      tokenId
    })
  }

  async getTokenDetails({
    address,
    chainId,
    tokenId
  }: {
    address: string
    chainId: string
    tokenId: string
  }): Promise<Erc721Token | Erc1155Token> {
    return this.glacierSdk.nfTs.getTokenDetails({
      address,
      chainId,
      tokenId
    })
  }

  async listAddressChains({
    address
  }: {
    address: string
  }): Promise<ListAddressChainsResponse> {
    return this.glacierSdk.evmChains.listAddressChains({
      address
    })
  }

  /**
   * Thin pass-through to Glacier's `primaryNetwork.listValidators`.
   *
   * Higher-level selection rules (e.g. the Fast Stake auto-selection
   * defined in PRD FR-QS-5) live in their respective hooks, so this method
   * stays a pure SDK wrapper that any caller can use with arbitrary query
   * filters.
   */
  async listPrimaryNetworkValidators(
    params: ListPrimaryNetworkValidatorsParams
  ): Promise<ListValidatorDetailsResponse> {
    return this.glacierSdk.primaryNetwork.listValidators(params)
  }

  /**
   * Lists C-Chain atomic (import/export) transactions for an address. These
   * live on Glacier's primary-network endpoint and are NOT returned by the
   * regular EVM `listTransactions` used by the EVM module — hence they are
   * missing from C-Chain activity unless fetched separately (CP-14760).
   *
   * `address` must be the 0x C-Chain EVM address; the endpoint accepts 0x
   * addresses for C-Chain atomic lookups.
   */
  async listCChainAtomicTransactions({
    address,
    isTestnet,
    pageSize = 100
  }: {
    address: string
    isTestnet: boolean
    pageSize?: number
  }): Promise<ListCChainAtomicTransactionsResponse> {
    const response =
      await this.glacierSdk.primaryNetworkTransactions.listLatestPrimaryNetworkTransactions(
        {
          blockchainId: BlockchainId.C_CHAIN,
          network: isTestnet ? Network.FUJI : Network.MAINNET,
          addresses: address,
          pageSize,
          sortOrder: SortOrder.DESC
        }
      )
    return response as ListCChainAtomicTransactionsResponse
  }
}

export default new GlacierService()
