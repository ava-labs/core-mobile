import {
  Erc1155Token,
  Erc721Token,
  Glacier,
  ListAddressChainsResponse
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
}

export default new GlacierService()
