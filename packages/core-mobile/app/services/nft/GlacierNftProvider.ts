import { NftProvider } from 'services/nft/types'
import {
  Erc1155Token,
  Erc721Token,
  ListErc1155BalancesResponse,
  ListErc721BalancesResponse
} from '@avalabs/glacier-sdk'
import { NFTItemData, NftResponse } from 'store/nft'
import Logger from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { glacierSdk } from 'utils/network/glacier'
import { addMissingFields } from './utils'

const demoAddress = '0x188c30e9a6527f5f0c3f7fe59b72ac7253c62f28'

export class GlacierNftProvider implements NftProvider {
  async isProviderFor(chainId: number): Promise<boolean> {
    const isHealthy = await this.isHealthy()
    if (!isHealthy) {
      return false
    }
    const supportedChainsResp = await glacierSdk.evmChains.supportedChains({})
    const chainInfos = supportedChainsResp.chains
    const chains = chainInfos.map(chain => chain.chainId)
    return chains.some(value => value === chainId.toString())
  }

  async fetchNfts(
    chainId: number,
    address: string,
    pageToken?: {
      erc1155?: string
      erc721?: string
    }
  ): Promise<NftResponse> {
    Logger.info('fetching nfts using Glacier')

    let erc721BalancesRequest: Promise<ListErc721BalancesResponse> | undefined
    if (pageToken?.erc721 !== '') {
      erc721BalancesRequest = glacierSdk.evmBalances.listErc721Balances({
        chainId: chainId.toString(),
        address: DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
        // glacier has a cap on page size of 100
        pageSize: 10,
        pageToken: pageToken?.erc721
      })
    }

    let erc1155BalancesRequest: Promise<ListErc1155BalancesResponse> | undefined
    if (pageToken?.erc1155 !== '') {
      erc1155BalancesRequest = glacierSdk.evmBalances.listErc1155Balances({
        chainId: chainId.toString(),
        address: DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
        // glacier has a cap on page size of 100
        pageSize: 10,
        pageToken: pageToken?.erc1155
      })
    }

    const responses = await Promise.allSettled([
      erc721BalancesRequest,
      erc1155BalancesRequest
    ])

    const nftBalances = [
      ...(responses[0].status === 'fulfilled'
        ? responses[0].value?.erc721TokenBalances ?? []
        : []),
      // ERC1155s can have 0 balance, which mean the user does not hold any of the token anymore
      // happens for example when being sold
      ...(responses[1].status === 'fulfilled'
        ? responses[1].value?.erc1155TokenBalances.filter(
            nft => nft.balance !== '0'
          ) ?? []
        : [])
    ]

    const fullNftData = nftBalances.map(nft => {
      return {
        ...addMissingFields(nft, address)
      }
    })

    const hasMore = responses.some(
      resp => resp.status !== 'fulfilled' || !!resp.value?.nextPageToken
    )

    const erc721NextPageToken =
      responses[0].status === 'fulfilled'
        ? responses[0].value?.nextPageToken
        : pageToken?.erc721 // reload the same page next time

    const erc1155NextPageToken =
      responses[1].status === 'fulfilled'
        ? responses[1].value?.nextPageToken
        : pageToken?.erc1155 // reload the same page next time

    return {
      nfts: fullNftData,
      nextPageToken: hasMore
        ? {
            erc721: erc721NextPageToken,
            erc1155: erc1155NextPageToken
          }
        : ''
    }
  }

  async fetchNft(
    chainId: number,
    address: string,
    tokenId: string
  ): Promise<NFTItemData> {
    const response = await glacierSdk.nfTs.getTokenDetails({
      chainId: chainId.toString(),
      address: DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
      tokenId: tokenId
    })

    return {
      ...addMissingFields(response, address)
    }
  }

  private async isHealthy(): Promise<boolean> {
    const healthStatus = await glacierSdk.healthCheck.healthCheck()
    const status = healthStatus?.status?.toString()
    return status === 'ok'
  }

  async reindexNft(
    address: string,
    chainId: number,
    tokenId: string
  ): Promise<Erc721Token | Erc1155Token> {
    await glacierSdk.nfTs.reindexNft({
      address,
      chainId: chainId.toString(),
      tokenId
    })

    return await glacierSdk.nfTs.getTokenDetails({
      chainId: chainId.toString(),
      address,
      tokenId
    })
  }
}

export default new GlacierNftProvider()
