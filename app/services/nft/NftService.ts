import glacierNftProvider from 'services/nft/GlacierNftProvider'
import covalentNftProvider from 'services/nft/CovalentNftProvider'
import { NftProvider } from 'services/nft/types'

export class NftService {
  providers: NftProvider[] = [glacierNftProvider, covalentNftProvider]

  getProvider(chainId: number): NftProvider | undefined {
    return this.providers.find(value => value.isProviderFor(chainId))
  }
}

export default new NftService()
