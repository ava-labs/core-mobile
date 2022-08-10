import { NftResponse } from 'store/nft'

export type NftUID = string

export interface NftProvider {
  isProviderFor(chainId: number): Promise<boolean>

  fetchNfts(
    chainId: number,
    address: string,
    selectedCurrency?: string,
    pageToken?: string
  ): Promise<NftResponse>
}
