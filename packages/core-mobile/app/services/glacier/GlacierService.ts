import {
  Erc1155Token,
  Erc721Token,
  Glacier,
  ListErc1155BalancesResponse,
  ListErc721BalancesResponse
} from '@avalabs/glacier-sdk'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { CORE_HEADERS } from 'utils/network/constants'
import { GlacierFetchHttpRequest } from './GlacierFetchHttpRequest'

if (!Config.GLACIER_URL)
  Logger.warn(
    'GLACIER_URL ENV is missing in env file. Glacier service disabled.'
  )

export const GLACIER_URL = Config.GLACIER_URL

class GlacierService {
  private glacierSdk = new Glacier(
    {
      BASE: process.env.GLACIER_URL,
      HEADERS: CORE_HEADERS
    },
    GlacierFetchHttpRequest
  )
  private isGlacierHealthy = true
  private supportedChainIds: string[] = []

  async isNetworkSupported(chainId: number): Promise<boolean> {
    this.glacierSdk.request
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
}

export default new GlacierService()
