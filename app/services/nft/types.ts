import { NftResponse } from 'store/nft'

export interface NftProvider {
  isProviderFor(chainId: number): Promise<boolean>

  fetchNfts(
    chainId: number,
    address: string,
    pageToken?: string,
    selectedCurrency?: string
  ): Promise<NftResponse>
}
