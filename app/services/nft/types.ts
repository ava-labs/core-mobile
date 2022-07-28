import { Erc721TokenBalance } from '@avalabs/glacier-sdk'

export type NftResponse = {
  erc721TokenBalances: Erc721TokenBalance[]
}

export interface NftProvider {
  isProviderFor(chainId: number): Promise<boolean>

  fetchNfts(
    chainId: number,
    address: string,
    selectedCurrency?: string
  ): Promise<void>
}
