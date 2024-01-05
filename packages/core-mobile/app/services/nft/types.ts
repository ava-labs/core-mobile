import { NftResponse } from 'store/nft'

export type NftUID = string

export interface NftProvider {
  isProviderFor(chainId: number): Promise<boolean>

  fetchNfts(
    chainId: number,
    address: string,
    pageToken?:
      | {
          erc1155?: string
          erc721?: string
        }
      | string
  ): Promise<NftResponse>
}
