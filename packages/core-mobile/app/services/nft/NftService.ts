import glacierNftProvider from 'services/nft/GlacierNftProvider'
import { NftProvider } from 'services/nft/types'
import { findAsyncSequential } from 'utils/Utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { NFTItemData, NftResponse } from 'store/nft'
import { SpanName } from 'services/sentry/types'

export class NftService {
  providers: NftProvider[] = [glacierNftProvider]

  private async getProvider(
    chainId: number,
    sentrySpanName?: SpanName
  ): Promise<NftProvider | undefined> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.nft.get_provider' },
      async () => {
        return findAsyncSequential(this.providers, value =>
          value.isProviderFor(chainId)
        )
      }
    )
  }

  /**
   * @throws {@link Error}
   */
  async fetchNfts({
    chainId,
    address,
    pageToken,
    sentrySpanName
  }: {
    chainId: number
    address: string
    pageToken?:
      | {
          erc1155?: string
          erc721?: string
        }
      | string
    sentrySpanName?: SpanName
  }): Promise<NftResponse> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.nft.fetchNfts' },
      async () => {
        //TODO: providers cant mix, so if suddenly one becomes unavailable we need to reset pageToken to undefined
        const provider = await this.getProvider(chainId)

        if (!provider) throw Error('no available providers')

        return await provider.fetchNfts(chainId, address, pageToken)
      }
    )
  }

  async fetchNft({
    chainId,
    address,
    tokenId,
    sentrySpanName
  }: {
    chainId: number
    address: string
    tokenId: string
    sentrySpanName?: SpanName
  }): Promise<NFTItemData> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.nft.fetchNft' },
      async () => {
        const provider = await this.getProvider(chainId)

        if (!provider) throw Error('no available providers')

        return await provider.fetchNft(chainId, address, tokenId)
      }
    )
  }

  async reindexNft(
    address: string,
    chainId: number,
    tokenId: string
  ): Promise<void> {
    const provider = await this.getProvider(chainId)

    if (!provider) throw Error('no available providers')

    await provider.reindexNft(address, chainId, tokenId)
  }
}

export default new NftService()
