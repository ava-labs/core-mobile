import glacierNftProvider from 'services/nft/GlacierNftProvider'
import { NftProvider } from 'services/nft/types'
import { findAsyncSequential } from 'utils/Utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { NFTItemData } from 'store/nft'

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

  async fetchNft({
    chainId,
    address,
    tokenId,
    sentryTrx
  }: {
    chainId: number
    address: string
    tokenId: string
    sentryTrx?: Transaction
  }): Promise<NFTItemData> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.nft.fetchNft')
      .executeAsync(async () => {
        const provider = await this.getProvider(chainId)

        if (!provider) throw Error('no available providers')

        return await provider.fetchNft(chainId, address, tokenId)
      })
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
