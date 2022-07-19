import { Erc721TokenBalanceDto } from '@avalabs/glacier-sdk'

export type NftResponse = {
  erc721TokenBalances: Erc721TokenBalanceDto[]
}

export interface NftProvider {
  isProviderFor(chainId: number): Promise<boolean>

  fetchNfts(
    chainId: number,
    address: string,
    selectedCurrency?: string
  ): Promise<void>
}
