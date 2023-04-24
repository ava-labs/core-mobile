import { NftProvider } from 'services/nft/types'
import {
  Glacier,
  ListErc1155BalancesResponse,
  ListErc721BalancesResponse
} from '@avalabs/glacier-sdk'
import { NftResponse } from 'store/nft'
import Logger from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { GLACIER_URL } from 'utils/glacierUtils'
import { addMissingFields } from './utils'

const demoAddress = '0x188c30e9a6527f5f0c3f7fe59b72ac7253c62f28'

export class GlacierNftProvider implements NftProvider {
  private glacierSdk = new Glacier({ BASE: GLACIER_URL })

  async isProviderFor(chainId: number): Promise<boolean> {
    const isHealthy = await this.isHealthy()
    if (!isHealthy) {
      return false
    }
    const supportedChainsResp = await this.glacierSdk.evm.supportedChains()
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

    let erc721BalancesResp: ListErc721BalancesResponse | undefined
    if (pageToken?.erc721 !== '') {
      erc721BalancesResp = await this.glacierSdk.evm.listErc721Balances({
        chainId: chainId.toString(),
        address: DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
        // glacier has a cap on page size of 100
        pageSize: 10,
        pageToken: pageToken?.erc721
      })
    }

    let erc1155BalancesResp: ListErc1155BalancesResponse | undefined
    if (pageToken?.erc1155 !== '') {
      erc1155BalancesResp = await this.glacierSdk.evm.listErc1155Balances({
        chainId: chainId.toString(),
        address: DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
        // glacier has a cap on page size of 100
        pageSize: 10,
        pageToken: pageToken?.erc1155
      })
    }

    const nftBalances = [
      ...(erc721BalancesResp?.erc721TokenBalances ?? []),
      ...(erc1155BalancesResp?.erc1155TokenBalances ?? [])
    ]

    const fullNftData = nftBalances.map(nft => addMissingFields(nft, address))

    const hasMore =
      !!erc1155BalancesResp?.nextPageToken ||
      !!erc721BalancesResp?.nextPageToken

    return {
      nfts: fullNftData,
      nextPageToken: hasMore
        ? {
            erc1155: erc1155BalancesResp?.nextPageToken,
            erc721: erc721BalancesResp?.nextPageToken
          }
        : ''
    }
  }

  private async isHealthy() {
    const healthStatus = await this.glacierSdk.healthCheck.healthCheck()
    const status = healthStatus?.status?.toString()
    return status === 'ok'
  }
}

export default new GlacierNftProvider()
