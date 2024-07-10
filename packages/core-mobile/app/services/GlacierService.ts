import {
  BlockchainId,
  ChainAddressChainIdMapListResponse,
  CurrencyCode,
  Erc1155Token,
  Erc721Token,
  GetNativeBalanceResponse,
  Glacier,
  ListCChainAtomicBalancesResponse,
  ListCChainAtomicTransactionsResponse,
  ListErc1155BalancesResponse,
  ListErc20BalancesResponse,
  ListErc721BalancesResponse,
  ListPChainBalancesResponse,
  ListPChainTransactionsResponse,
  ListXChainBalancesResponse,
  ListXChainTransactionsResponse,
  Network,
  PrimaryNetworkTxType,
  SortOrder
} from '@avalabs/glacier-sdk'
import Config from 'react-native-config'
import { ChainId } from '@avalabs/chains-sdk'

if (!Config.GLACIER_URL) throw Error('GLACIER_URL ENV is missing')

export const GLACIER_URL = Config.GLACIER_URL

class GlacierService {
  private glacierSdk = new Glacier({ BASE: process.env.GLACIER_URL })
  private isGlacierHealthy = true
  private supportedChainIds: string[] = []

  constructor() {
    /**
     * This is for performance, basically we just cache the health of glacier every 5 seconds and
     * go off of that instead of every request
     */
    this.getSupportedChainIds().catch(() => {
      // Noop. It will be retried by .isSupportedNetwork calls upon unlocking if necessary.
    })
  }

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

  async getChainBalance(params: {
    blockchainId: BlockchainId
    network: Network
    blockTimestamp?: number
    addresses?: string
  }): Promise<
    | ListPChainBalancesResponse
    | ListXChainBalancesResponse
    | ListCChainAtomicBalancesResponse
  > {
    return this.glacierSdk.primaryNetworkBalances.getBalancesByAddresses(params)
  }

  async listLatestPrimaryNetworkTransactions(params: {
    blockchainId: BlockchainId
    network: Network
    addresses?: string
    txTypes?: Array<PrimaryNetworkTxType>
    startTimestamp?: number
    endTimestamp?: number
    pageToken?: string
    pageSize?: number
    sortOrder?: SortOrder
  }): Promise<
    | ListPChainTransactionsResponse
    | ListXChainTransactionsResponse
    | ListCChainAtomicTransactionsResponse
  > {
    return this.glacierSdk.primaryNetworkTransactions.listLatestPrimaryNetworkTransactions(
      params
    )
  }
  async getChainIdsForAddresses(params: {
    addresses: string
    network: Network
  }): Promise<ChainAddressChainIdMapListResponse> {
    return this.glacierSdk.primaryNetwork.getChainIdsForAddresses(params)
  }

  private async getSupportedChainIds(): Promise<string[]> {
    if (this.supportedChainIds.length) {
      return this.supportedChainIds
    }

    try {
      const supportedChains = await this.glacierSdk.evmChains.supportedChains(
        {}
      )
      this.supportedChainIds = supportedChains.chains.map(
        chain => chain.chainId
      )
      //even though glacier supports X and P chains the SDK doesn't provide 'em as list
      // so we push them manually
      this.supportedChainIds.push(ChainId.AVALANCHE_XP.toString())
      this.supportedChainIds.push(ChainId.AVALANCHE_TEST_XP.toString())
      return this.supportedChainIds
    } catch {
      return []
    }
  }

  async getNativeBalance({
    chainId,
    address,
    currency
  }: {
    chainId: string
    address: string
    currency: CurrencyCode
  }): Promise<GetNativeBalanceResponse> {
    return this.glacierSdk.evmBalances.getNativeBalance({
      chainId,
      address,
      currency: currency.toLocaleLowerCase() as CurrencyCode
    })
  }

  async listErc721Balances({
    chainId,
    address,
    pageSize,
    pageToken
  }: {
    chainId: string
    address: string
    pageSize: number
    pageToken?: string
  }): Promise<ListErc721BalancesResponse> {
    return this.glacierSdk.evmBalances.listErc721Balances({
      chainId,
      address,
      pageSize,
      pageToken
    })
  }

  async listErc1155Balances({
    chainId,
    address,
    pageSize,
    pageToken
  }: {
    chainId: string
    address: string
    pageSize: number
    pageToken?: string
  }): Promise<ListErc1155BalancesResponse> {
    return this.glacierSdk.evmBalances.listErc1155Balances({
      chainId,
      address,
      pageSize,
      pageToken
    })
  }

  async listErc20Balances({
    chainId,
    address,
    currency,
    pageSize,
    pageToken
  }: {
    chainId: string
    address: string
    currency: CurrencyCode
    pageSize: number
    pageToken?: string
  }): Promise<ListErc20BalancesResponse> {
    return this.glacierSdk.evmBalances.listErc20Balances({
      chainId,
      address,
      currency: currency.toLocaleLowerCase() as CurrencyCode,
      pageSize,
      pageToken
    })
  }
}

export default new GlacierService()
