import { Erc1155Token, Erc721Token } from '@avalabs/glacier-sdk'
import { NFTItemData, NftResponse } from 'store/nft'

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

  fetchNft(
    chainId: number,
    address: string,
    tokenId: string
  ): Promise<NFTItemData>

  reindexNft(
    address: string,
    chainId: number,
    tokenId: string
  ): Promise<Erc721Token | Erc1155Token>
}
