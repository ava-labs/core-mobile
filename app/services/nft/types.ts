import { Erc721TokenBalance } from '@avalabs/glacier-sdk'
import { NftPagedData } from 'store/nft'

export type NftResponse = {
  erc721TokenBalances: Erc721TokenBalance[]
}

export interface NftProvider {
  isProviderFor(chainId: number): Promise<boolean>

  fetchNfts(
    chainId: number,
    address: string,
    pageToken?: string,
    selectedCurrency?: string
  ): Promise<NftPagedData>
}
