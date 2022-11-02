import glacierNftProvider from 'services/nft/GlacierNftProvider'
import covalentNftProvider from 'services/nft/CovalentNftProvider'
import { NftProvider } from 'services/nft/types'
import { findAsyncSequential } from 'utils/Utils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'

export class NftService {
  providers: NftProvider[] = [glacierNftProvider, covalentNftProvider]

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
  async fetchNft(
    chainId: number,
    address: string,
    selectedCurrency?: string,
    pageToken?: string,
    sentryTrx?: Transaction
  ) {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.nft.fetch')
      .executeAsync(async () => {
        //TODO: providers cant mix, so if suddenly one becomes unavailable we need to reset pageToken to undefined
        const provider = await this.getProvider(chainId)

        if (!provider) throw Error('no available providers')

        return await provider.fetchNfts(
          chainId,
          address,
          selectedCurrency,
          pageToken
        )
      })
  }
}

export default new NftService()
