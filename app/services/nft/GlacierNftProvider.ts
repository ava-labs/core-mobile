import { NftProvider } from 'services/nft/types'
import {
  ListErc1155BalancesResponse,
  ListErc721BalancesResponse
} from '@avalabs/glacier-sdk'
import { NftResponse } from 'store/nft'
import Logger from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { glacierSdk } from 'utils/network/glacier'
import { addMissingFields, convertIPFSResolver } from './utils'

const demoAddress = '0x188c30e9a6527f5f0c3f7fe59b72ac7253c62f28'

export class GlacierNftProvider implements NftProvider {
  async isProviderFor(chainId: number): Promise<boolean> {
    const isHealthy = await this.isHealthy()
    if (!isHealthy) {
      return false
    }
    const supportedChainsResp = await glacierSdk.evm.supportedChains()
    const chainInfos = supportedChainsResp.chains
    const chains = chainInfos.map(chain => chain.chainId)
    return chains.some(value => value === chainId.toString())
  }

  async fetchNfts(
    chainId: number,
    address: string,
    selectedCurrency?: string,
    pageToken?: {
      erc1155?: string
      erc721?: string
    }
  ): Promise<NftResponse> {
    Logger.info('fetching nfts using Glacier')

    let erc721BalancesRequest: Promise<ListErc721BalancesResponse> | undefined
    if (pageToken?.erc721 !== '') {
      erc721BalancesRequest = glacierSdk.evm.listErc721Balances({
        chainId: chainId.toString(),
        address: DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
        // glacier has a cap on page size of 100
        pageSize: 10,
        pageToken: pageToken?.erc721
      })
    }

    let erc1155BalancesRequest: Promise<ListErc1155BalancesResponse> | undefined
    if (pageToken?.erc1155 !== '') {
      erc1155BalancesRequest = glacierSdk.evm.listErc1155Balances({
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
      const imageUri = nft.metadata.imageUri

      return {
        ...addMissingFields(nft, address),
        // also try to resolve ipfs image uri if there is one
        // this allows the app to display the image right away
        // instead of waiting for all the background processing (fetch metadata, image aspect,...) to finish
        ...(imageUri && {
          metadata: {
            ...nft.metadata,
            imageUri: convertIPFSResolver(imageUri)
          }
        })
      }
    })

    const hasMore = responses.some(
      resp => resp.status !== 'fulfilled' || !!resp.value?.nextPageToken
    )

    return {
      nfts: fullNftData,
      nextPageToken: hasMore
        ? {
            erc721:
              responses[0].status === 'fulfilled'
                ? responses[0].value?.nextPageToken
                : pageToken?.erc721, // reload the same page next time
            erc1155:
              responses[1].status === 'fulfilled'
                ? responses[1].value?.nextPageToken
                : pageToken?.erc1155
          }
        : ''
    }
  }

  private async isHealthy() {
    const healthStatus = await glacierSdk.healthCheck.healthCheck()
    const status = healthStatus?.status?.toString()
    return status === 'ok'
  }
}

export default new GlacierNftProvider()
