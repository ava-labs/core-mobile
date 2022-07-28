import glacierNftProvider from 'services/nft/GlacierNftProvider'
import covalentNftProvider from 'services/nft/CovalentNftProvider'
import { NftProvider } from 'services/nft/types'
import { Erc721TokenBalance } from '@avalabs/glacier-sdk'

export type NftUID = string

export function getNftUID(nft: Erc721TokenBalance): NftUID {
  return nft.contractAddress + nft.tokenId
}

export class NftService {
  providers: NftProvider[] = [glacierNftProvider, covalentNftProvider]

  private getProvider(chainId: number): NftProvider | undefined {
    return this.providers.find(value => value.isProviderFor(chainId))
  }

  /**
   * @throws {@link Error}
   */
  fetchNft(chainId: number, address: string, selectedCurrency: string) {
    const provider = this.getProvider(chainId)
    if (!provider) throw Error('no available providers')
    return provider.fetchNfts(chainId, address, selectedCurrency)
  }
}

export default new NftService()
