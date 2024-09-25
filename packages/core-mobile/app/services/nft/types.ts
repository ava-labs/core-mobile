import { NFTItemData } from 'store/nft'

export type NftUID = string

export interface NftProvider {
  isProviderFor(chainId: number): Promise<boolean>

  fetchNft(
    chainId: number,
    address: string,
    tokenId: string
  ): Promise<NFTItemData>

  reindexNft(address: string, chainId: number, tokenId: string): Promise<void>
}
