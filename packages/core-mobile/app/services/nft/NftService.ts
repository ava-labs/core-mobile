import glacierNftProvider from 'services/nft/GlacierNftProvider'
import { NftProvider } from 'services/nft/types'
import { findAsyncSequential } from 'utils/Utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { NftResponse } from 'store/nft'
import { Erc1155Token, Erc721Token } from '@avalabs/glacier-sdk'
import { glacierSdk } from 'utils/network/glacier'

export class NftService {
  providers: NftProvider[] = [glacierNftProvider]

  private async getProvider(
    chainId: number,
    sentryTrx?: Transaction
  ): Promise<NftProvider | undefined> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.nft.get_provider')
      .executeAsync(async () => {
        return findAsyncSequential(this.providers, value =>
          value.isProviderFor(chainId)
        )
      })
  }

  /**
   * @throws {@link Error}
   */
  async fetchNft({
    chainId,
    address,
    pageToken,
    sentryTrx
  }: {
    chainId: number
    address: string
    pageToken?:
      | {
          erc1155?: string
          erc721?: string
        }
      | string
    sentryTrx?: Transaction
  }): Promise<NftResponse> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.nft.fetch')
      .executeAsync(async () => {
        //TODO: providers cant mix, so if suddenly one becomes unavailable we need to reset pageToken to undefined
        const provider = await this.getProvider(chainId)

        if (!provider) throw Error('no available providers')

        return await provider.fetchNfts(chainId, address, pageToken)
      })
  }

  async reindexNfts(
    address: string,
    chainId: string,
    tokenId: string
  ): Promise<Erc721Token | Erc1155Token> {
    await glacierSdk.nfTs.reindexNft({ address, chainId, tokenId })

    return await glacierSdk.nfTs.getTokenDetails({
      address,
      chainId,
      tokenId
    })
  }
}

export default new NftService()
